# SPEC 14 — Publicar entradas del staff con o sin imágenes

> **Estado:** Implementado
> **Depende de:** SPEC 06 (modal "Crear publicación"), SPEC 09 (autenticación y perfil real), SPEC 10 (tablas `rooms` y `children`), SPEC 12 (patrón server action + `refresh()`), SPEC 13 (tablas `posts`, `post_children`, `post_photos` y RLS)
> **Fecha:** 2026-09-15
> **Objetivo:** Conectar el feed `/` y el modal de publicación a Supabase para que el staff publique entradas con o sin fotos (Storage privado con signed URLs) y persistan tras recargar.

## Scope

**In:**

- Feed `/` real: lee `posts` + `post_children` + `post_photos` + perfil del autor desde Supabase con el cliente de sesión (RLS). El staff ve las publicaciones de su guardería; un padre ve solo las etiquetadas a sus hijos + anuncios de la sala de sus hijos (políticas de SPEC 13).
- Modal "Nueva publicación" conectado: selector de SALA (chips) cuando el daycare tiene más de una sala, autoseleccionado si hay una sola; chips PARA con los niños activos de la sala seleccionada; chips TIPO (7); textarea DESCRIPCIÓN (1–2000 caracteres); sección FOTOS real.
- Fotos: hasta 5 por publicación, `jpeg`/`png`/`webp`, ≤5 MB c/u, compresión client-side antes de subir, previews con opción de quitar, orden por selección (`position`).
- Reglas de audiencia al persistir:
  - Niños específicos → filas en `post_children` (y `room_id = NULL` si el tipo es `announcement`, para que no lo vea toda la sala).
  - "Toda la sala" → se etiquetan todos los niños activos de la sala en `post_children`; si el tipo es `announcement`, además `room_id` = sala sin tags.
  - `posts.for_whole_room = true` cuando la audiencia es "Toda la sala" (permite reconstruir "Para:" sin heurísticas).
- Bloqueo de `photo_consent`: chips deshabilitados en la UI cuando la publicación lleva fotos **y** rechazo en DB (políticas). En "Toda la sala" con fotos, los niños sin consentimiento quedan fuera de los tags con aviso al staff.
- Storage: bucket privado `post-photos` (límite 5 MB, mime types permitidos), path `{daycare_id}/{post_id}/{uuid}.{ext}`, políticas de `storage.objects` para staff y padres. `post_photos.url` guarda el **path**; el feed genera signed URLs de 1 h al renderizar.
- Tarjeta real del feed: autor staff ("publicado por vos" si es el usuario actual), hora/fecha real, audiencia ("Para: toda la sala" / "familia de X, Y"), texto y fotos reales (grid si hay varias). "Editar" queda solo en publicaciones propias como link muerto.
- Roles: composer "Compartí un momento…" y botón "Nueva publicación" ocultos para padres; el padre ve su feed filtrado con etiquetas mínimas (sin "Para:" ni nombre del autor, porque la RLS no le permite leer `children` ni perfiles de staff).
- Header real del feed: nombre de la guardería + total de niños activos + fecha de hoy (staff). Empty state "Todavía no hay publicaciones".
- Migraciones versionadas: `for_whole_room`, enforcement de consentimiento, bucket + políticas de Storage, visibilidad de colegas/daycare para staff.
- Verificación: SQL/RLS con rollback, Playwright con `juan@mail.cl`, auditoría `db-security-auditor` y migración de limpieza de datos de prueba.
- Endurecimiento post-auditoría: `posts.daycare_id` (snapshot con trigger e índice), consentimiento de fotos también en el INSERT de Storage, path de foto estricto y política `posts_delete_staff` (solo autor) para el cleanup.

**Out of scope (para futuros specs):**

- Edición y borrado de publicaciones/fotos desde la UI (el link "Editar" queda muerto).
- Visor de foto a pantalla completa (`foto.dc.html`) y detalle de publicación (`detalle-publicacion.dc.html`).
- UI dedicada del feed de familia (`familia-feed.dc.html`); el padre ve el feed con el layout actual.
- Reactions y comments (`likes`/`comments` siguen mostrándose en 0).
- Notificaciones (`notify_on_post`), `daily_summaries` y avisos.
- Seed de publicaciones.
- Paginación o scroll infinito (el feed se limita a las 50 más recientes).
- Videos u otros formatos; soporte nativo de HEIC.
- Anuncios "toda la guardería" (con `room_id = NULL`) visibles a todos los padres.
- Hardening de `users_update_own`/`handle_new_user` (hallazgo Crítico preexistente de SPEC 08).

## Data model

### Migración 1 — `agregar_for_whole_room_posts`

```sql
alter table public.posts
  add column for_whole_room boolean not null default false;
```

### Migración 2 — `endurecer_consentimiento_fotos_posts`

Helpers nuevos en `private` (patrón de SPEC 11/13: `security definer`, `stable`, `search_path = ''`, `EXECUTE` solo para `authenticated`):

```sql
create or replace function private.post_has_photos(p_post_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.post_photos ph where ph.post_id = p_post_id
  )
$$;

create or replace function private.child_photo_consent(p_child_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select c.photo_consent from public.children c where c.id = p_child_id
$$;

create or replace function private.post_children_all_consent(p_post_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select not exists (
    select 1
    from public.post_children pc
    join public.children c on c.id = pc.child_id
    where pc.post_id = p_post_id
      and c.photo_consent is false
  )
$$;
```

Políticas reemplazadas (el resto de las 12 políticas de SPEC 13 no cambia):

```sql
drop policy "post_children_insert_staff" on public.post_children;

create policy "post_children_insert_staff" on public.post_children
  for insert to authenticated
  with check (
    private.staff_can_read_post(post_id)
    and private.is_child_in_staff_daycare(child_id)
    and (
      not private.post_has_photos(post_id)
      or private.child_photo_consent(child_id)
    )
  );

drop policy "post_photos_insert_staff" on public.post_photos;

create policy "post_photos_insert_staff" on public.post_photos
  for insert to authenticated
  with check (
    private.staff_can_read_post(post_id)
    and private.post_children_all_consent(post_id)
  );
```

### Migración 3 — `crear_bucket_fotos_posts`

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-photos',
  'post-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create or replace function private.post_id_from_photo_path(p_name text)
returns uuid language sql immutable security definer set search_path = ''
as $$
  select case
    when split_part(p_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     and split_part(p_name, '/', 2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     and split_part(p_name, '/', 3) <> ''
    then split_part(p_name, '/', 2)::uuid
  end
$$;

create policy "post_photos_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'post-photos'
    and private.post_id_from_photo_path(name) is not null
    and (
      private.staff_can_read_post(private.post_id_from_photo_path(name))
      or private.parent_can_read_post(private.post_id_from_photo_path(name))
    )
  );

create policy "post_photos_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-photos'
    and split_part(name, '/', 1) = (select private.current_staff_daycare_id())::text
    and private.staff_can_read_post(private.post_id_from_photo_path(name))
  );

create policy "post_photos_storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'post-photos'
    and private.post_id_from_photo_path(name) is not null
    and private.staff_can_read_post(private.post_id_from_photo_path(name))
  );
```

### Migración 4 — `visibilidad_colegas_y_daycare_staff`

```sql
create or replace function private.staff_colleagues()
returns setof uuid language sql stable security definer set search_path = ''
as $$
  select u.id
  from public.users u
  where u.daycare_id = private.current_staff_daycare_id()
    and u.role in ('staff', 'admin')
$$;

create policy "users_select_staff_colleagues" on public.users
  for select to authenticated
  using (id in (select private.staff_colleagues()));

create policy "daycares_select_staff" on public.daycares
  for select to authenticated
  using (id = (select private.current_staff_daycare_id()));
```

### Migración 5 — `fix_posts_select_staff_autor_returning`

`INSERT … RETURNING` aplica las políticas de SELECT a la fila nueva y `private.staff_can_read_post(id)` no ve la fila recién insertada (snapshot). Sin este fix, publicar falla con 42501:

```sql
drop policy "posts_select_staff" on public.posts;

create policy "posts_select_staff" on public.posts
  for select to authenticated
  using (
    author_id = (select auth.uid())
    or private.staff_can_read_post(id)
  );
```

### Migración 6 — `endurecer_daycare_posts_y_storage`

Cierra hallazgos de la auditoría `db-security-auditor`: snapshot del daycare en el post (el acceso del staff ya no depende del daycare *actual* del autor), consentimiento también en el INSERT de Storage, path de foto estricto, `posts_delete_staff` para el cleanup e índices:

```sql
alter table public.posts
  add column daycare_id uuid references public.daycares(id);

update public.posts p
set daycare_id = coalesce(
  (select r.daycare_id from public.rooms r where r.id = p.room_id),
  (select u.daycare_id from public.users u where u.id = p.author_id)
)
where p.daycare_id is null;

alter table public.posts alter column daycare_id set not null;

create index posts_daycare_id_idx on public.posts (daycare_id);
create index users_daycare_id_idx on public.users (daycare_id);

create or replace function private.set_post_daycare()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.daycare_id := coalesce(
      (select r.daycare_id from public.rooms r where r.id = new.room_id),
      (select u.daycare_id from public.users u where u.id = new.author_id)
    );
  else
    new.daycare_id := old.daycare_id;
  end if;
  return new;
end
$$;

create trigger posts_set_daycare
  before insert or update on public.posts
  for each row execute procedure private.set_post_daycare();

create or replace function private.staff_can_read_post(p_post_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.posts p
    where p.id = p_post_id
      and p.daycare_id = private.current_staff_daycare_id()
  )
$$;
```

Además: `posts_insert_staff` y `posts_update_staff` validan `daycare_id = current_staff_daycare_id()`; `post_photos_storage_insert` suma `private.post_children_all_consent(post_id)`; `post_id_from_photo_path` exige exactamente 3 segmentos y extensión `jpg|jpeg|png|webp`; `staff_colleagues()` queda alineado a `role = 'staff'`.

La política `posts_delete_staff` (creada en la migración 2) permite al autor borrar su propio post; la usa el cleanup de la server action y no expone borrado en la UI:

```sql
create policy "posts_delete_staff" on public.posts
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    and (select private.current_staff_daycare_id()) is not null
  );
```

### Migración 7 — `limpiar_datos_prueba_posts` (se aplica al final de la verificación)

```sql
delete from public.posts where body like 'PRUEBA E2E%';
```

> Los objetos del bucket se borran con la Storage API (el trigger `storage.protect_delete` bloquea el DELETE directo por SQL); borrar la fila de `posts` cascadea `post_children` y `post_photos`.

### Tipos y contrato de la server action

```ts
// app/lib/posts.ts
export type PostTypeDb =
  | "meal" | "nap" | "activity" | "achievement"
  | "mood" | "photo" | "announcement";

export interface FeedPhoto {
  path: string;              // post_photos.url (path en Storage)
  url: string | null;        // signed URL de 1 h generada al leer
  width: number | null;
  height: number | null;
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  publishedAt: string;       // ISO
  type: PostType;            // tipo UI en español
  audience: string;          // "toda la sala" | "familia de X, Y" | ""
  text: string;
  forWholeRoom: boolean;
  photos: FeedPhoto[];
}
```

```ts
// app/actions/posts.ts
export interface CreatePostResult {
  ok: boolean;
  error?: string;
}

export async function createPost(formData: FormData): Promise<CreatePostResult>;
// formData: type (enum DB), roomId (uuid), childIds (uuid[], solo si no es whole room),
// wholeRoom ("1"), body (string), photos (File[]), photoDims (JSON [{width,height}] por foto)
```

Convenciones:

- `POST_TYPE_TO_UI`: `meal→comida`, `nap→siesta`, `activity→actividad`, `achievement→logro`, `mood→animo`, `photo→foto`, `announcement→anuncio` (y el mapa inverso para el insert).
- `posts.title` queda `NULL` (el modal no tiene campo de título).
- `published_at` = `now()` por default de la tabla; el feed formatea `HH:MM` si es hoy, `d MMM` si es otro día.
- `post_photos.position` = índice de selección (0-based).
- Validación server-side: staff con `daycare_id`, `type` válido, sala del daycare, niños activos de la sala, `body` 1–2000, `photos.length ≤ 5`, mime en lista, ≤5 MB; tipo `foto` exige ≥1 foto.
- Orden del insert: `posts` → `post_children` → subida a Storage → `post_photos`. Si algo falla después del insert del post, se borran los objetos subidos y el post (cascade limpia tags y fotos).

## Implementation plan

1. Aplicar migración 1 (`agregar_for_whole_room_posts`) con `supabase_apply_migration` y guardar el archivo en `supabase/migrations/`. Verificar con `list_tables`.
2. Aplicar migración 2 (helpers + políticas de consentimiento + `posts_delete_staff`) y guardar el archivo. Probar con SQL en transacción `rollback`: etiquetar un niño sin consentimiento en un post con fotos falla con 42501; agregar una foto con niño sin consentimiento etiquetado falla con 42501.
3. Aplicar migración 3 (bucket + helper de path + políticas de Storage) y guardar el archivo. Verificar `storage.buckets` (privado, 5 MB, mime types) y las 3 políticas.
4. Aplicar migración 4 (colegas + daycare visibles para staff) y guardar el archivo. Verificar con SQL como staff y como padre.
5. `next.config.ts`: `experimental.serverActions.bodySizeLimit = "30mb"`. `npm run build` sigue pasando.
6. Crear `app/lib/posts.ts` (tipos, mapas ES↔EN, `audienceLabel` desde tags/`for_whole_room`, formato de fecha) y `app/lib/image.ts` (compresión client-side con `createImageBitmap` + canvas, máx 1600 px, quality 0.85, fallback al original).
7. Crear `app/actions/posts.ts` con `createPost(formData)`: validaciones, audiencia, exclusión por consentimiento, insert, subida, `post_photos`, cleanup ante error y `refresh()`.
8. Refactorizar `app/components/feed/create-post-modal.tsx`: selector SALA, chips PARA reales por sala, fotos reales (input múltiple oculto, previews, quitar), bloqueo por consentimiento con aviso, estado "Publicando…" y errores inline.
9. Refactorizar `create-post-provider.tsx` (props `rooms`, `childrenByRoom`, `isStaff`; ya no guarda `posts`) y `app/page.tsx` (server component: perfil, sala/daycare, niños, posts, signed URLs, header real y empty state; padre sin composer).
10. Refactorizar `post-list.tsx` y `post-card.tsx` para renderizar `FeedPost` real (autor, fecha, audiencia, fotos en grid, "publicado por vos", "Editar" solo propio); ocultar "Nueva publicación" en `sidebar.tsx` y el composer para padres; reducir `app/lib/data.ts` a fallbacks (`ROOM`, `USER`) y eliminar `POSTS`/`KIDS` del feed y modal.
11. Migración 5 (`fix_posts_select_staff_autor_returning`): sin esto, `INSERT … RETURNING` falla con 42501 porque las políticas de SELECT no ven la fila recién insertada. Aplicar, guardar el archivo y verificar el insert con `RETURNING` como staff.
12. Migración 6 (`endurecer_daycare_posts_y_storage`): snapshot `posts.daycare_id` + trigger, `staff_can_read_post` por daycare del post, consentimiento en el INSERT de Storage, path estricto e índices. Aplicar, guardar y re-probar los flujos.
13. Verificación con Playwright (login `juan@mail.cl` / `Abc123456`): publicar sin foto, con 2 fotos, "Toda la sala" con fotos (aviso de consentimiento), anuncio dirigido y de sala, tipo Foto sin fotos, límites de fotos; recargar y comprobar persistencia, fotos reales y empty state.
14. Auditoría con `@db-security-auditor` y cierre de hallazgos; migración 7 de limpieza (objetos vía Storage API + posts por SQL). `npm run lint` y `npm run build` sin errores.

## Acceptance criteria

- [x] `list_migrations` registra las 7 migraciones: `agregar_for_whole_room_posts`, `endurecer_consentimiento_fotos_posts`, `crear_bucket_fotos_posts`, `visibilidad_colegas_y_daycare_staff`, `fix_posts_select_staff_autor_returning`, `endurecer_daycare_posts_y_storage` y `limpiar_datos_prueba_posts`.
- [x] `public.posts` tiene `for_whole_room boolean not null default false`.
- [x] `public.posts` tiene `daycare_id uuid not null` con trigger `posts_set_daycare`, backfill sin nulos e índices `posts_daycare_id_idx` y `users_daycare_id_idx`.
- [x] `post_children_insert_staff` rechaza etiquetar un niño con `photo_consent = false` cuando el post ya tiene fotos (SQL 42501) y lo permite cuando no tiene fotos.
- [x] `post_photos_insert_staff` rechaza insertar una foto si hay algún niño etiquetado sin consentimiento (SQL 42501).
- [x] `post_photos_storage_insert` exige `post_children_all_consent(post_id)` además del daycare y de `staff_can_read_post`.
- [x] `storage.buckets` tiene `post-photos` con `public = false`, `file_size_limit = 5242880` y `allowed_mime_types` = jpeg/png/webp.
- [x] Existen las 3 políticas de `storage.objects` (`post_photos_storage_select`, `post_photos_storage_insert`, `post_photos_storage_delete`).
- [x] `users_select_staff_colleagues` deja que un staff lea el perfil de un colega del mismo daycare y no el de otro daycare; `daycares_select_staff` deja leer el nombre de su propia guardería.
- [x] `posts_select_staff` incluye `author_id = auth.uid()` (fix del `INSERT … RETURNING`); `posts_delete_staff` borra solo posts propios (0 filas para posts de otro staff y para padres).
- [x] `post_id_from_photo_path` exige exactamente 3 segmentos con UUIDs y extensión `jpg|jpeg|png|webp`; paths malformados o de otro daycare se rechazan (42501).
- [x] `npm run lint` y `npm run build` terminan sin errores.
- [x] El modal muestra el selector SALA con las salas del daycare (Soles, Estrellas, Nubes) y los chips PARA con los niños activos de la sala seleccionada.
- [x] Publicar sin foto etiquetando a Diego Diaz: el modal se cierra, la publicación aparece al inicio del feed con autor "Juan Herrera", "publicado por vos", "Para: familia de Diego", tipo elegido y hora actual; persiste tras recargar.
- [x] Publicar con 2 fotos: los archivos se suben al path `{daycare_id}/{post_id}/…`, `post_photos` guarda 2 filas con `position` 0 y 1 y `width`/`height`, y la tarjeta muestra las 2 fotos reales (signed URLs).
- [x] Publicar "Toda la sala" con fotos: Martina López y Valentina Vega (sin consentimiento) no quedan en `post_children` (solo Diego y Felipe), la UI muestra el aviso de familias excluidas y sus chips aparecen deshabilitados cuando hay fotos.
- [x] Con fotos cargadas, los chips de niños sin consentimiento están deshabilitados y no se pueden seleccionar.
- [x] Anuncio dirigido a un niño: `room_id = NULL` y solo esa familia lo ve (SQL como padre: no ve el anuncio dirigido a Felipe).
- [x] Anuncio "Toda la sala": `room_id` = sala, `for_whole_room = true`, sin tags; el padre de Nubes lo ve.
- [x] Tipo "Foto" sin fotos mantiene "Publicar" deshabilitado.
- [x] Seleccionar 6 fotos a la vez agrega 5 y muestra "Podés adjuntar hasta 5 fotos."; un archivo >5 MB se rechaza con "Cada foto puede pesar hasta 5 MB." y no se agrega.
- [x] Si el insert o la subida fallan, el modal queda abierto con mensaje y no quedan filas en `posts` ni objetos en el bucket (verificado con el fallo real de `INSERT … RETURNING`).
- [x] Un padre no ve el composer ni el botón "Nueva publicación" (`isStaff` en `/` y `canPost` en el sidebar) y ve solo las publicaciones etiquetadas a sus hijos + anuncios de su sala (4 de 5 posts de prueba en SQL/RLS; credenciales de Playwright de padre no disponibles).
- [x] El header muestra el nombre real de la guardería, el total de niños activos y la fecha; con 0 publicaciones se ve el empty state.
- [x] La consola del navegador no muestra errores en `/` durante los flujos anteriores.
- [x] La auditoría `db-security-auditor` no reporta hallazgos Críticos/Altos nuevos: el Crítico de `users_update_own` es preexistente (SPEC 08) y el Alto de `staff_can_read_post` quedó cerrado con el snapshot `posts.daycare_id`; quedan documentados el Medio de edición por otros staff (spec de edición futuro) y el Bajo del path (cerrado en la migración 6).
- [x] Los advisors de seguridad no reportan hallazgos nuevos y performance no reporta `auth_rls_initplan` en las tablas/políticas tocadas.
- [x] Al terminar la verificación, `select count(*)` de `posts`, `post_children` y `post_photos` vuelve a 0 y no quedan objetos de prueba en `storage.objects`.

## Decisions

- **Sí:** el feed lee de la DB en este spec. Sin esto, publicar no sirve: al recargar desaparecería. El staff ve su guardería; el padre ve su feed por RLS con UI mínima (composer oculto, sin "Para:" ni autor, porque no puede leer `children` ni perfiles de staff).
- **Sí:** selector de sala en el modal cuando el daycare tiene >1 sala; autoselección con una sola. Evita publicar a la sala equivocada (el daycare de prueba tiene 3).
- **Sí:** "Toda la sala" etiqueta a los niños activos en `post_children`. Compatible con la RLS de SPEC 13, permite aplicar `photo_consent` por niño y no cambia las políticas del padre.
- **Sí:** anuncio dirigido = tags con `room_id = NULL`; anuncio de sala = `room_id` + `for_whole_room = true` sin tags. La audiencia elegida siempre se respeta (con la RLS actual, un anuncio con `room_id` lo ve toda la sala).
- **Sí:** columna `posts.for_whole_room` para reconstruir "Para: toda la sala" con exactitud, aunque cambien tags o niños después.
- **Sí:** bucket privado `post-photos` + signed URLs de 1 h. Las fotos de menores no deben quedar accesibles con un link permanente.
- **Sí:** `post_photos.url` guarda el path en Storage (no una URL firmada, que expira). El feed firma al renderizar.
- **Sí:** hasta 5 fotos, ≤5 MB, jpeg/png/webp, compresión client-side sin dependencias nuevas (canvas) y fallback al original si la compresión falla.
- **Sí:** bloqueo de `photo_consent` en UI **y** en DB. El cliente puede mentir; las políticas son la garantía.
- **Sí:** en "Toda la sala" con fotos se excluye a los niños sin consentimiento con aviso, en vez de bloquear la publicación completa.
- **Sí:** autor = staff (`author_id`), "publicado por vos" si es el usuario actual. Se aleja del mock (que muestra al niño como autor) porque el schema guarda al staff.
- **Sí:** migración RLS para que staff lea perfiles de colegas del mismo daycare y el nombre de su guardería (necesarios para el feed y el header).
- **Sí:** miniatura real en la tarjeta (grid si hay varias); visor full-screen y detalle quedan para otro spec.
- **Sí:** server action `createPost` con cleanup ante fallos (borra objetos y post). Mantiene el patrón de `createInvitation` (SPEC 12) y `refresh()`.
- **Sí:** `bodySizeLimit` a 30 MB en `next.config.ts`; el default de 1 MB no soporta 5 fotos.
- **Sí:** verificación sin seed: se publica desde la UI con `juan@mail.cl` y la migración 7 limpia los datos de prueba.
- **Sí:** `posts_delete_staff` (solo autor) para el cleanup de la server action ante fallos; la UI no expone borrado.
- **Sí:** `posts_select_staff` suma `author_id = auth.uid()`: `INSERT … RETURNING` aplica las políticas de SELECT y el helper no ve la fila recién insertada (sin esto, publicar fallaba con 42501).
- **Sí:** snapshot `posts.daycare_id` con trigger: cierra el hallazgo Alto de la auditoría (el acceso del staff ya no depende del daycare *actual* del autor) y habilita el índice por daycare.
- **Sí:** consentimiento también en `post_photos_storage_insert`: el archivo no puede subirse si hay niños sin consentimiento etiquetados, aunque se saltee la UI.
- **Sí:** path de foto estricto (3 segmentos + extensión `jpg|jpeg|png|webp`) y `staff_colleagues()` alineado a `role = 'staff'`.
- **Sí:** limpieza de objetos con la Storage API (el DELETE directo por SQL está bloqueado por `storage.protect_delete`) y borrado de posts por SQL.
- **No:** restringir `posts_update_staff`/`post_photos_delete_staff` a solo autor en este spec; la edición/borrado por otros staff del mismo daycare queda documentado para el spec de edición.
- **No:** edición/borrado, visor full-screen, detalle de publicación, familia-feed completo, reactions/comments, notificaciones, seed, paginación, videos/HEIC, anuncios "toda la guardería" visibles a padres.
- **No:** guardar la URL pública o firmada en `post_photos.url`; expira o expone la foto.
- **No:** comprimir en el servidor (requeriría dependencias nativas); la compresión es client-side.

## Risks

| Risk | Mitigation |
|---|---|
| La server action supera el límite de 1 MB con fotos | `bodySizeLimit: "30mb"` en `next.config.ts` + compresión client-side; verificado en los docs locales de Next 16. |
| La compresión client-side falla en algún navegador | Fallback al archivo original; el límite de 5 MB y el bucket siguen validando. |
| Las signed URLs de 1 h expiran en una pestaña vieja | El feed regenera URLs en cada render; recargar restaura las imágenes. |
| Borrar `storage.objects` por SQL está bloqueado (`storage.protect_delete`) | La limpieza de objetos usa la Storage API con la sesión del staff (política `post_photos_storage_delete`); los posts se borran por SQL y cascadean tags/fotos. |
| La migración 4 amplía la visibilidad de `users`/`daycares` para staff | Solo mismo daycare (`current_staff_daycare_id()`), helpers `security definer` con `search_path = ''`; auditoría `db-security-auditor`. |
| La política de consentimiento no valida el contenido de la imagen, solo los niños etiquetados | Documentado: una foto sin tags podría incluir a un niño sin consentimiento; el control es por etiquetado. Revisión humana del staff. |
| El padre no puede leer nombres de niños ni del autor por RLS | UI mínima del padre (sin "Para:" ni autor); el familia-feed completo va en otro spec. |
| Hallazgos Críticos preexistentes de SPEC 08 (`users_update_own`, `handle_new_user`) | Fuera de alcance; documentados en SPEC 13. SPEC 14 amplía su impacto (un padre auto-promovido a staff vería posts y fotos del daycare), por lo que el hardening de `users` gana urgencia. |
| El helper `staff_can_read_post` dependía del daycare *actual* del autor (fuga cross-tenant si el autor cambia de guardería) | Cerrado en la migración 6: `posts.daycare_id` (snapshot + trigger) y el helper autoriza por el daycare del post; re-verificado en la auditoría. |
| Cualquier staff del daycare puede editar/borrar posts, tags y fotos de otros autores (Medio de la auditoría) | Sin UI de edición en este spec; se resuelve en el spec de edición/borrado con reglas por autor. Documentado. |
| `INSERT … RETURNING` con RLS podía fallar al publicar | `posts_select_staff` incluye al autor; verificado con publicaciones reales en Playwright. |
| Los objetos de Storage se borran por API y los posts por SQL | `storage.protect_delete` impide el DELETE directo; el cleanup usa la Storage API con la sesión del staff. |
| HEIC de iPhone no aceptado | iOS Safari convierte a JPEG al usar el input de archivos; si no, se rechaza con mensaje. |
| `multiple_permissive_policies` en `users` al sumar la política de colegas | Esperado: políticas permisivas se combinan con OR; el advisor lo reporta sin impacto funcional. |

## What is **not** in this spec

- Edición y borrado de publicaciones o fotos desde la UI.
- Visor de foto a pantalla completa y detalle de publicación.
- UI dedicada del feed de familia (`familia-feed.dc.html`).
- Reactions y comments funcionales.
- Notificaciones, `daily_summaries` y avisos.
- Seed de publicaciones.
- Paginación, scroll infinito, videos y HEIC nativo.
- Anuncios generales de guardería visibles a todos los padres.
- Hardening de `users`/signup (SPEC 08).

Cada uno de esos puntos, si llega, va en su propio spec.
