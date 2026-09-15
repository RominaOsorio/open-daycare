# SPEC 13 — Tablas `posts`, `post_children` y `post_photos` (publicaciones y etiquetado)

> **Estado:** Implementado
> **Depende de:** SPEC 08 (tabla `users`), SPEC 10 (tablas `rooms` y `children`), SPEC 11 (tabla `parent_children`)
> **Fecha:** 2026-09-14
> **Objetivo:** Crear el enum `post_type` y las tablas `posts`, `post_children` y `post_photos` de la referencia `07-DB-Schema`, con RLS para staff y padres (el feed del padre = posts etiquetados a sus hijos + anuncios de su sala), sin conectar todavía la UI.

## Scope

**In:**

- Enum `public.post_type` con 7 valores: `meal`, `nap`, `activity`, `achievement`, `mood`, `photo`, `announcement`.
- Tabla `public.posts` según la referencia: `id uuid PK`, `author_id uuid NOT NULL FK → users` (sin cascada), `room_id uuid` nullable FK → rooms (`on delete set null`), `type post_type NOT NULL`, `title text` nullable, `body text NOT NULL`, `published_at timestamptz NOT NULL default now()`, `created_at`/`updated_at` con trigger `posts_set_updated_at` (reutiliza `public.set_updated_at` de SPEC 08).
- Tabla `public.post_children` según la referencia: PK compuesta (`post_id`, `child_id`), ambas FKs `NOT NULL` con `on delete cascade`.
- Tabla `public.post_photos` según la referencia: `id uuid PK`, `post_id uuid NOT NULL FK → posts` (`on delete cascade`), `url text NOT NULL`, `width`/`height` `int` nullable, `position int NOT NULL default 0`, `created_at`.
- RLS activado en las tres tablas.
- Índices: `posts_published_at_idx (published_at desc)`, `posts_author_id_idx`, `posts_room_id_idx`, `post_children_child_id_idx` y `post_photos_post_id_idx (post_id, position)`.
- Funciones helper `security definer` en el schema `private` (patrón de SPEC 11/12, `set search_path = ''`, `EXECUTE` solo para `authenticated`): `is_parent_of_child`, `parent_can_read_post`, `is_child_in_staff_daycare` y `staff_can_read_post` (esta última reutiliza `private.current_staff_daycare_id()`).
- Políticas RLS `to authenticated`:
  - **Staff** (misma guardería): `posts_select_staff`, `posts_insert_staff` (`author_id = auth.uid()` y sala del daycare si no es NULL), `posts_update_staff`, `post_children_select_staff`, `post_children_insert_staff` (post visible + niño del daycare), `post_children_delete_staff`, `post_photos_select_staff`, `post_photos_insert_staff` y `post_photos_delete_staff`.
  - **Padre**: `posts_select_parent` (etiquetados a sus hijos vía `post_children` **o** `type = 'announcement'` con `room_id` de la sala de sus hijos), `post_children_select_parent` (`is_parent_of_child(child_id)`) y `post_photos_select_parent` (`parent_can_read_post(post_id)`).
- Fix de seguridad (hallazgo Alto de la auditoría `db-security-auditor`): migración `endurecer_posts_update_staff_sala_daycare` con el `WITH CHECK` de `posts_update_staff` validando que `room_id` sea NULL o de una sala del daycare del staff (evita mover publicaciones cross-tenant y filtrar etiquetas/fotos de niños ajenos).
- Migraciones versionadas aplicadas con `supabase_apply_migration` + archivos en `supabase/migrations/`.

**Out of scope (para futuros specs):**

- Conectar la UI: el feed de `/` y el modal "Crear publicación" (SPEC 06) siguen en memoria con el mock `POSTS`/`KIDS`.
- Supabase Storage: bucket, upload y URLs firmadas. `post_photos.url` solo guarda el texto de la URL.
- Filtrado por `children.photo_consent` (no bloquea etiquetar ni mostrar fotos todavía).
- Tablas `reactions` y `comments` (secciones 10 y 11 de la referencia).
- DELETE de `posts` y edición/borrado desde UI.
- Seed de publicaciones de prueba.
- Notificaciones (`notify_on_post`) y `daily_summaries`.

## Data model

Dos migraciones. La primera crea el enum, las tablas, RLS, trigger e índices:

```sql
create type public.post_type as enum (
  'meal', 'nap', 'activity', 'achievement', 'mood', 'photo', 'announcement'
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id),
  room_id uuid references public.rooms(id) on delete set null,
  type public.post_type not null,
  title text,
  body text not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_children (
  post_id uuid not null references public.posts(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  primary key (post_id, child_id)
);

create table public.post_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  url text not null,
  width int,
  height int,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;
alter table public.post_children enable row level security;
alter table public.post_photos enable row level security;

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute procedure public.set_updated_at();

create index posts_published_at_idx on public.posts (published_at desc);
create index posts_author_id_idx on public.posts (author_id);
create index posts_room_id_idx on public.posts (room_id);
create index post_children_child_id_idx on public.post_children (child_id);
create index post_photos_post_id_idx on public.post_photos (post_id, position);
```

La segunda crea las funciones helper y las políticas. Los helpers son `security definer` porque las políticas no pueden hacer JOIN directo a `users`/`children`: el staff no tiene política para leer filas de otros `users` y el padre no tiene política sobre `children`, así que un JOIN en la política devolvería cero filas (o recursión).

```sql
create or replace function private.is_parent_of_child(p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.parent_children pc
    where pc.child_id = p_child_id
      and pc.parent_id = (select auth.uid())
  )
$$;

create or replace function private.parent_can_read_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and (
        exists (
          select 1
          from public.post_children pc
          where pc.post_id = p.id
            and private.is_parent_of_child(pc.child_id)
        )
        or (
          p.type = 'announcement'
          and exists (
            select 1
            from public.children c
            join public.parent_children pc on pc.child_id = c.id
            where pc.parent_id = (select auth.uid())
              and c.room_id = p.room_id
          )
        )
      )
  )
$$;

create or replace function private.is_child_in_staff_daycare(p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.children c
    join public.rooms r on r.id = c.room_id
    where c.id = p_child_id
      and r.daycare_id = private.current_staff_daycare_id()
  )
$$;

create or replace function private.staff_can_read_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and (
        exists (
          select 1 from public.users a
          where a.id = p.author_id
            and a.daycare_id = private.current_staff_daycare_id()
        )
        or exists (
          select 1 from public.rooms r
          where r.id = p.room_id
            and r.daycare_id = private.current_staff_daycare_id()
        )
      )
  )
$$;

revoke execute on function private.is_parent_of_child(uuid) from public, anon, service_role;
revoke execute on function private.parent_can_read_post(uuid) from public, anon, service_role;
revoke execute on function private.is_child_in_staff_daycare(uuid) from public, anon, service_role;
revoke execute on function private.staff_can_read_post(uuid) from public, anon, service_role;
grant execute on function private.is_parent_of_child(uuid) to authenticated;
grant execute on function private.parent_can_read_post(uuid) to authenticated;
grant execute on function private.is_child_in_staff_daycare(uuid) to authenticated;
grant execute on function private.staff_can_read_post(uuid) to authenticated;

create policy "posts_select_staff" on public.posts
  for select to authenticated
  using (private.staff_can_read_post(id));

create policy "posts_insert_staff" on public.posts
  for insert to authenticated
  with check (
    (select private.current_staff_daycare_id()) is not null
    and author_id = (select auth.uid())
    and (
      room_id is null
      or exists (
        select 1 from public.rooms r
        where r.id = room_id
          and r.daycare_id = (select private.current_staff_daycare_id())
      )
    )
  );

create policy "posts_update_staff" on public.posts
  for update to authenticated
  using (private.staff_can_read_post(id))
  with check (private.staff_can_read_post(id));

create policy "post_children_select_staff" on public.post_children
  for select to authenticated
  using (private.staff_can_read_post(post_id));

create policy "post_children_insert_staff" on public.post_children
  for insert to authenticated
  with check (
    private.staff_can_read_post(post_id)
    and private.is_child_in_staff_daycare(child_id)
  );

create policy "post_children_delete_staff" on public.post_children
  for delete to authenticated
  using (private.staff_can_read_post(post_id));

create policy "post_photos_select_staff" on public.post_photos
  for select to authenticated
  using (private.staff_can_read_post(post_id));

create policy "post_photos_insert_staff" on public.post_photos
  for insert to authenticated
  with check (private.staff_can_read_post(post_id));

create policy "post_photos_delete_staff" on public.post_photos
  for delete to authenticated
  using (private.staff_can_read_post(post_id));

create policy "posts_select_parent" on public.posts
  for select to authenticated
  using (private.parent_can_read_post(id));

create policy "post_children_select_parent" on public.post_children
  for select to authenticated
  using (private.is_parent_of_child(child_id));

create policy "post_photos_select_parent" on public.post_photos
  for select to authenticated
  using (private.parent_can_read_post(post_id));
```

La tercera migración endurece el `WITH CHECK` de `posts_update_staff` (hallazgo Alto de la auditoría de seguridad):

```sql
drop policy "posts_update_staff" on public.posts;

create policy "posts_update_staff" on public.posts
  for update to authenticated
  using (private.staff_can_read_post(id))
  with check (
    private.staff_can_read_post(id)
    and (
      room_id is null
      or exists (
        select 1 from public.rooms r
        where r.id = room_id
          and r.daycare_id = (select private.current_staff_daycare_id())
      )
    )
  );
```

Convenciones:

- Todo lo persistido va en inglés (`post_type`, tags); las etiquetas UI traducen `meal` → Comida, `nap` → Siesta, `activity` → Actividad, `achievement` → Logro, `mood` → Ánimo, `photo` → Foto, `announcement` → Anuncio.
- `mood` se agrega al enum (7 valores) para alinear con el chip "Ánimo" del modal de SPEC 06, aunque la referencia liste 6.
- `author_id` sin cascada: borrar un usuario staff no debe borrar el historial de publicaciones.
- `room_id` nullable: `NULL` = publicación general (sin sala). Los anuncios con `room_id = NULL` no se muestran a los padres (solo anuncios de la sala de sus hijos); queda documentado para un spec futuro.
- `body` NOT NULL (la descripción es obligatoria en el modal); `title` nullable (ej. "Anuncio general").
- `post_photos.position` ordena las fotos dentro de la publicación (default 0).
- El feed del padre se resuelve con `posts_select_parent` + `post_children_select_parent` + `post_photos_select_parent`; no se expone `children` a los padres en este spec.
- Los helpers viven en `private` y solo `authenticated` puede ejecutarlos; el `search_path` vacío obliga a calificar todos los objetos.

## Implementation plan

1. Aplicar la migración `crear_tablas_posts_post_children_post_photos` con `supabase_apply_migration` (enum + tablas + RLS + trigger + índices, atómico) y guardar el archivo en `supabase/migrations/<timestamp>_crear_tablas_posts_post_children_post_photos.sql`.
2. Aplicar la migración `agregar_funciones_politicas_posts` (helpers + 12 políticas) y guardar el archivo en `supabase/migrations/<timestamp>_agregar_funciones_politicas_posts.sql`.
3. Aplicar la migración `endurecer_posts_update_staff_sala_daycare` (fix del hallazgo Alto de la auditoría: el `WITH CHECK` del UPDATE valida la sala contra el daycare del staff) y guardar el archivo en `supabase/migrations/<timestamp>_endurecer_posts_update_staff_sala_daycare.sql`.
4. Verificar con `list_migrations`, `list_tables` (columnas, RLS), `pg_enum` (7 valores), `pg_constraint` (PK compuesta, FKs y sus `on delete`), `pg_indexes`, `pg_policies` (12 políticas) y advisors de seguridad y performance.
5. Prueba funcional de RLS en una transacción con `rollback` (no deja datos), impersonando `authenticated` con claims:
   - Juan (staff): INSERT de un post con etiqueta a Diego Diaz, una foto y un anuncio de sala; SELECT de lo insertado; INSERT de `post_children` con un niño de otro daycare rechazado.
   - Pedro (padre de Diego Diaz): SELECT del post etiquetado y del anuncio de la sala Nubes, con sus filas de `post_children` y `post_photos`; INSERT/UPDATE rechazados; un post de otra sala/niño no visible.
   - Un `sub` ajeno: no ve ninguna fila.
   - Confirmar que las tres tablas quedan vacías tras el `rollback`.
6. Auditar con `@db-security-auditor` (RLS, helpers `security definer`, grants) y cerrar los hallazgos que correspondan.

## Acceptance criteria

- [x] `list_migrations` registra `crear_tablas_posts_post_children_post_photos`, `agregar_funciones_politicas_posts` y `endurecer_posts_update_staff_sala_daycare`.
- [x] El enum `public.post_type` existe con exactamente 7 valores: `meal`, `nap`, `activity`, `achievement`, `mood`, `photo`, `announcement`.
- [x] `list_tables` muestra `public.posts` (id, author_id, room_id, type, title, body, published_at, created_at, updated_at) con `rls_enabled: true`.
- [x] `list_tables` muestra `public.post_children` (post_id, child_id) con `rls_enabled: true` y PK compuesta (`post_id`, `child_id`).
- [x] `list_tables` muestra `public.post_photos` (id, post_id, url, width, height, position, created_at) con `rls_enabled: true`.
- [x] `posts` tiene FK `author_id` → `users` sin cascada, FK `room_id` → `rooms` nullable con `on delete set null`, y trigger `posts_set_updated_at`.
- [x] `post_children` tiene FKs `post_id` → `posts` y `child_id` → `children` con `on delete cascade`.
- [x] `post_photos` tiene FK `post_id` → `posts` con `on delete cascade`; `width`/`height` nullable y `position` default 0.
- [x] Existen los índices `posts_published_at_idx`, `posts_author_id_idx`, `posts_room_id_idx`, `post_children_child_id_idx` y `post_photos_post_id_idx`.
- [x] Existen las funciones `private.is_parent_of_child`, `private.parent_can_read_post`, `private.is_child_in_staff_daycare` y `private.staff_can_read_post`, `security definer`, `stable`, `search_path = ''`, con `EXECUTE` solo para `authenticated`.
- [x] `pg_policies` muestra las 12 políticas `to authenticated`: 9 de staff (`posts_select_staff`, `posts_insert_staff`, `posts_update_staff`, `post_children_select_staff`, `post_children_insert_staff`, `post_children_delete_staff`, `post_photos_select_staff`, `post_photos_insert_staff`, `post_photos_delete_staff`) y 3 de padre (`posts_select_parent`, `post_children_select_parent`, `post_photos_select_parent`).
- [x] La política `posts_update_staff` bloquea mover una publicación a una sala de otra guardería (42501) y permite moverla entre salas del mismo daycare o dejarla con `room_id = NULL`.
- [x] `authenticated` tiene grants de SELECT/INSERT/UPDATE/DELETE según la operación de cada tabla; `anon` no tiene políticas.
- [x] Prueba funcional con `begin … rollback`: Juan (staff) inserta y lee un post etiquetado a Diego Diaz con foto y un anuncio de sala; no puede etiquetar niños de otro daycare.
- [x] Prueba funcional con `begin … rollback`: Pedro (padre) ve el post etiquetado a Diego y el anuncio de Nubes (con `post_children` y `post_photos`), no ve publicaciones de otros niños/salas, y sus INSERT/UPDATE son rechazados.
- [x] Prueba funcional con `begin … rollback`: un `sub` sin vínculos no ve ninguna fila de las tres tablas.
- [x] `select count(*)` de `public.posts`, `public.post_children` y `public.post_photos` = 0 (sin seed).
- [x] Los advisors de seguridad no reportan problemas nuevos.
- [x] Los advisors de performance no reportan `auth_rls_initplan` en las tablas nuevas (los `multiple_permissive_policies` por las políticas de staff + padre y los `unused_index` de tablas vacías son esperados).

## Decisions

- **Sí:** spec solo de base de datos, patrón de SPEC 11. La conexión del feed y del modal "Crear publicación" va en su propio spec.
- **Sí:** dos migraciones (tablas + índices / funciones + políticas), mismo patrón de SPEC 10 y SPEC 11.
- **Sí:** `post_type` con 7 valores: se agrega `mood` para que el chip "Ánimo" del mockup tenga valor en DB.
- **Sí:** `author_id` sin cascada (preserva publicaciones) y `room_id` con `on delete set null` (la publicación general sobrevive si se borra la sala).
- **Sí:** `body` NOT NULL y `title` nullable; `published_at` default `now()`.
- **Sí:** `post_photos.position` default 0 para ordenar fotos.
- **Sí:** feed del padre = posts etiquetados a sus hijos + anuncios (`type = 'announcement'`) de la sala de sus hijos. Los anuncios con `room_id = NULL` no se muestran a los padres en este spec.
- **Sí:** helpers `security definer` en `private`: las políticas no pueden hacer JOIN directo a `users` (el staff no lee otros usuarios) ni a `children` (el padre no tiene política), y evitan recursión.
- **Sí:** staff puede SELECT/INSERT/UPDATE `posts` y SELECT/INSERT/DELETE en `post_children`/`post_photos` (editar etiquetas y fotos); sin DELETE de `posts`.
- **Sí:** fix del hallazgo Alto de la auditoría de seguridad: `posts_update_staff` valida en el `WITH CHECK` que la sala destino sea del daycare del staff. Mover entre salas propias o a `NULL` sigue permitido.
- **Sí:** `auth.uid()`/`auth.jwt()` envueltos en `(select ...)` dentro de los helpers para el InitPlan.
- **No:** conectar UI, Storage/bucket, `photo_consent`, `reactions`, `comments`, seed, DELETE de posts.

## Risks

| Risk | Mitigation |
|---|---|
| Las políticas dependen de helpers `security definer`; un error en un helper puede filtrar datos entre daycares | Helpers con `auth.uid()` interno, `search_path = ''`, `EXECUTE` solo `authenticated`; prueba funcional de RLS + auditoría con `db-security-auditor`. |
| `staff_can_read_post` evalúa autor **o** sala: un post con autor de la guardería y sala de otra quedaría visible para ambas | `posts_insert_staff` y `posts_update_staff` validan que la sala pertenezca al daycare del staff; auditoría de seguridad aplicada (hallazgo Alto corregido en la migración 3). |
| Hallazgos Críticos preexistentes de SPEC 08: `users_update_own` permite auto-promoverse a `staff`/cambiar `daycare_id`, y `handle_new_user` toma `role`/`daycare_id` de `raw_user_meta_data` | Fuera del alcance de este spec; la auditoría `db-security-auditor` los reportó y necesitan su propio spec de hardening de `users`/signup. |
| Un anuncio con `room_id = NULL` no lo ve ningún padre | Decisión de este spec; si el producto necesita anuncios generales, se agrega en el spec de UI del feed. |
| `multiple_permissive_policies` en las tres tablas (staff + padre) | Esperado: las políticas permisivas se combinan con OR; el advisor lo reporta pero no es un problema funcional. |
| `photo_consent` no se aplica todavía | Documentado como out of scope; se resuelve en el spec de subida/fotos. |

## What is **not** in this spec

- Conexión de UI (feed de `/` y modal "Crear publicación" siguen en memoria).
- Supabase Storage, bucket, upload y URLs firmadas.
- Filtrado por `children.photo_consent`.
- Tablas `reactions` y `comments`.
- DELETE de `posts` y edición/borrado desde UI.
- Seed de publicaciones y notificaciones (`notify_on_post`).

Cada uno de esos puntos, si llega, va en su propio spec.
