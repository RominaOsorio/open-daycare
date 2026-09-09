# SPEC 10 — Mantenimiento de niños (`rooms` + `children` + `/kids` con Supabase)

> **Estado:** Implementado
> **Depende de:** SPEC 07 (tabla `daycares`), SPEC 08 (tabla `users`), SPEC 09 (auth y políticas de `users`)
> **Fecha:** 2026-09-07
> **Objetivo:** Crear las tablas `rooms` y `children` según la referencia `07-DB-Schema`, sembrar 3 salas por defecto (Soles, Nubes, Estrellas) sin niños, y conectar `/kids` a Supabase para listar niños por sala (estado vacío) y dar de alta niños de forma persistente. Las tarjetas navegan a un perfil dinámico `/kids/[id]` que lee el niño desde `children`.

## Scope

**In:**

- Enum `public.child_status` (`active`, `archived`).
- Tabla `public.rooms` según la referencia: `id uuid PK`, `daycare_id uuid NOT NULL FK → daycares`, `name text NOT NULL`, `created_at`.
- Tabla `public.children` según la referencia: `id uuid PK`, `room_id uuid NOT NULL FK → rooms`, `full_name text NOT NULL`, `birth_date date NOT NULL`, `enrolled_at date NOT NULL`, `medical_notes text` nullable, `allergy_tags text[] NOT NULL default '{}'`, `photo_consent boolean NOT NULL default true`, `status child_status NOT NULL default 'active'`, `created_at`/`updated_at` con trigger `children_set_updated_at` (reutiliza `public.set_updated_at` de SPEC 08).
- RLS activado en ambas tablas.
- Políticas RLS para staff (misma `daycare_id`, `role = 'staff'`): SELECT sobre `rooms`; SELECT/INSERT/UPDATE sobre `children` (validando que `room_id` pertenezca a una sala del daycare del staff).
- Seed: 3 salas para "Guardería Sala Soles": **Soles**, **Nubes** y **Estrellas**. Sin niños en `children` (la tabla queda vacía).
- `/kids` conectado a Supabase: `app/kids/page.tsx` (server) lee `rooms` + `children` con el client de `utils/supabase/server.ts` y los pasa a `KidsManager`.
- `KidsGrid` agrupa por sala (solo salas con niños, en orden Soles → Nubes → Estrellas) y muestra estado vacío "No hay niños registrados todavía…" cuando no hay ninguno.
- `AddKidModal` alta persistente: INSERT en `children` (con el client browser), alergias en inglés en `allergy_tags` (input libre parseado), `medical_notes`, `enrolled_at` = hoy, `photo_consent` = true, `status` = `active`; al guardar con éxito se cierra y `router.refresh()` recarga el listado.
- Alergias: input de texto libre (como el mockup) que se parsea a tags en inglés (`maní`→`peanut`, `lactosa`→`lactose`, `gluten`→`gluten`, `huevo`→`egg`, `soja`→`soy`, `nueces`→`nuts`); tokens no reconocidos se agregan a `medical_notes`. La UI traduce los tags a MAYÚSCULAS (MANÍ, LACTOSA…).
- Tarjetas de niños navegables: la tarjeta enlaza a `/kids/[id]` (perfil dinámico que lee el niño desde `children` con el client de server, JOIN de `rooms` para el nombre de sala; `notFound()` si no existe).
- `/kids/[id]` (antes `/kids/[slug]` con mock) usa los componentes de perfil existentes (ProfileHeader, AllergyBox, KidInfoCard, ParentsCard) alimentados con datos reales: edad calculada desde `birth_date`, sala desde `rooms`, ingreso desde `enrolled_at`, alergias traducidas y notas.
- ParentsCard en el perfil real muestra "sin padres vinculados" (botón Vincular padre sigue funcionando con estado local; `parent_children` llega en otro spec).

**Out of scope (para futuros specs):**

- Tablas restantes (`posts`, `parent_children`, `invitations`, `daily_summaries`, …).
- Edición/archivado de niños y vinculación real de padres (`parent_children`) — en este spec `parents-card` mantiene estado local (los padres cargados en el perfil no persisten).
- Vista de rol Familia (padres) — las políticas son staff-only.
- Seed de niños de prueba.
- Salas (CRUD de rooms) — solo seed por defecto.
- El mock `KIDS` de `app/lib/kids.ts` no se elimina: `create-post-modal` aún lo usa.

## Data model

DDL de la migración `crear_tablas_rooms_children`:

```sql
create type public.child_status as enum ('active', 'archived');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id),
  full_name text not null,
  birth_date date not null,
  enrolled_at date not null,
  medical_notes text,
  allergy_tags text[] not null default '{}',
  photo_consent boolean not null default true,
  status public.child_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rooms enable row level security;
alter table public.children enable row level security;

create trigger children_set_updated_at
  before update on public.children
  for each row execute procedure public.set_updated_at();

insert into public.rooms (daycare_id, name)
select d.id, r.name
from public.daycares d
cross join (values ('Soles'), ('Nubes'), ('Estrellas')) as r(name)
where d.name = 'Guardería Sala Soles';
```

DDL de la migración `agregar_politicas_rls_rooms_children` (staff de la misma guardería):

```sql
create policy "rooms_select_staff" on public.rooms
  for select to authenticated
  using (
    (select role from public.users where id = auth.uid()) = 'staff'
    and daycare_id = (select daycare_id from public.users where id = auth.uid())
  );

create policy "children_select_staff" on public.children
  for select to authenticated
  using (
    (select role from public.users where id = auth.uid()) = 'staff'
    and exists (
      select 1 from public.rooms r
      where r.id = room_id
        and r.daycare_id = (select daycare_id from public.users where id = auth.uid())
    )
  );

create policy "children_insert_staff" on public.children
  for insert to authenticated
  with check (
    (select role from public.users where id = auth.uid()) = 'staff'
    and exists (
      select 1 from public.rooms r
      where r.id = room_id
        and r.daycare_id = (select daycare_id from public.users where id = auth.uid())
    )
  );

create policy "children_update_staff" on public.children
  for update to authenticated
  using (
    (select role from public.users where id = auth.uid()) = 'staff'
    and exists (
      select 1 from public.rooms r
      where r.id = room_id
        and r.daycare_id = (select daycare_id from public.users where id = auth.uid())
    )
  )
  with check (
    (select role from public.users where id = auth.uid()) = 'staff'
    and exists (
      select 1 from public.rooms r
      where r.id = room_id
        and r.daycare_id = (select daycare_id from public.users where id = auth.uid())
    )
  );
```

Tipo UI (`app/lib/kids-data.ts`):

```ts
interface Room { id: string; name: string; }

interface Kid {
  id: string;           // uuid de children
  name: string;
  initial: string;
  age: number;          // calculado desde birth_date
  avatarBg: string;
  avatarColor: string;
  allergy?: string;     // etiquetas UI unidas, ej. "MANÍ, LACTOSA"
  allergyTags: string[]; // tags en inglés (allergy_tags)
  roomId: string;
  roomName: string;
  birthDate: string;    // display "12 mar 2022"
  notes?: string;
}
```

Convenciones:

- Alergias en inglés en DB (referencia); la UI traduce con `TAG_TO_LABEL` (`peanut`→MANÍ, `lactose`→LACTOSA, `gluten`→GLUTEN, `egg`→HUEVO, `soy`→SOJA, `nuts`→FRUTOS SECOS).
- `parseAllergies(texto)`: separa por comas, normaliza (minúsculas, sin acentos), mapea conocidas a tags en inglés; lo no reconocido vuelve como lista `extra` que se anexa a `medical_notes` ("Alergias: …").
- Edad desde `birth_date` (ISO) con la misma lógica de `ageFrom`; `birthDate` display "día mes año" con mes corto en español.
- Orden de salas: Soles primero, luego el resto alfabéticamente (`sortRooms`).
- `enrolled_at` = fecha actual ISO al insertar; `photo_consent` = `true` (no hay campo en el mockup).
- `app/lib/kids.ts` conserva `KIDS` (mock) y helpers de `link-parent-modal`; se eliminan `ROOMS`, `Room`, `NewKidInput`, `AVATAR_PALETTE`, `buildKid` y `slugify` (solo los usaba el modal viejo).

## Implementation plan

1. Aplicar la migración `crear_tablas_rooms_children` con `supabase_apply_migration` (enum + tablas + RLS + trigger + seed de salas, atómico) y guardar el archivo en `supabase/migrations/<timestamp>_crear_tablas_rooms_children.sql`.
2. Aplicar la migración `agregar_politicas_rls_rooms_children` y guardar el archivo en `supabase/migrations/<timestamp>_agregar_politicas_rls_rooms_children.sql`.
3. Verificar con `list_migrations`, `list_tables` (columnas, RLS, políticas, 3 salas, 0 niños) y advisors de seguridad.
4. `app/lib/kids-data.ts`: tipos `Room`/`Kid`, `AVATAR_PALETTE`, `sortRooms`, `ageFromBirthDate`, `formatBirthDate`, `ALLERGY_TO_TAG`, `TAG_TO_LABEL`, `parseAllergies`, `mapChildRow(row, roomName, index)`.
5. `app/lib/kids.ts`: quitar `ROOMS`/`Room`/`NewKidInput`/`AVATAR_PALETTE`/`buildKid`/`slugify` (quedan sin uso); conservar el resto.
6. `app/kids/page.tsx` (server): leer `rooms` (id, name) y `children` activos con el client de cookies; ordenar salas, mapear filas a `Kid` y pasar `rooms` + `kids` a `KidsManager`.
7. `app/components/kids/kids-manager.tsx`: props `initialKids`/`rooms`; botón "Agregar niño" abre el modal; `handleSave` hace INSERT en `children` con el client browser (`createClient()`), muestra error si falla y `router.refresh()` al éxito; estado `saving`.
8. `app/components/kids/add-kid-modal.tsx`: select SALA con opciones de `rooms` (valor = id, etiqueta = nombre, preseleccionada la primera); validación igual que hoy (nombre, fecha `dd/mm/aaaa`, sala); `handleSave` parsea alergias y llama a `onSave({ name, birthDate, roomId, allergyTags, notes })`; "Guardar" deshabilitado mientras guarda; muestra error de persistencia.
9. `app/components/kids/kids-grid.tsx`: recibir `kids` + `rooms`; secciones solo para salas con niños (orden `sortRooms`); estado vacío global cuando no hay niños; sin prop `navigableSlugs`.
10. `app/components/kids/kid-card.tsx`: usar `kid.id` como key, tarjeta como `<Link>` a `/kids/${kid.id}` (con hover/chevron del diseño original), texto "sin padres vinculados", badge de alergia o VINCULAR.
11. Perfil dinámico: reemplazar `app/kids/[slug]/page.tsx` por `app/kids/[id]/page.tsx` — server component que lee `children` por id (misma sesión con cookies), JOIN de `rooms` para el nombre de sala, `notFound()` si no existe; sin `generateStaticParams`. Adaptar `ProfileHeader`/`AllergyBox`/`KidInfoCard`/`ParentsCard` al tipo `Kid` de `kids-data` (`roomName`, `entryDate`) y pasar `parents` vacío en el perfil real. El botón "Editar" y "Resumen del día" siguen como no-op.
12. Verificar: `npm run lint`, `npm run build`, pruebas manuales con Playwright (login `juan@mail.cl` / `Abc123456`, `/kids` vacío, alta de "Martina López" en Nubes, persistencia tras recargar, click a su tarjeta → perfil real, Volver a Niños) y consulta de `children` con SQL.

## Acceptance criteria

- [x] `list_migrations` registra `crear_tablas_rooms_children` y `agregar_politicas_rls_rooms_children`.
- [x] `list_tables` muestra `public.rooms` (id, daycare_id, name, created_at) y `public.children` (id, room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, photo_consent, status, created_at, updated_at) con `rls_enabled: true` en ambas.
- [x] `select * from public.rooms` devuelve exactamente 3 filas para "Guardería Sala Soles": Soles, Nubes y Estrellas.
- [x] `select count(*) from public.children` = 0.
- [x] `list_tables` muestra las políticas `rooms_select_staff`, `children_select_staff`, `children_insert_staff` y `children_update_staff`.
- [x] Los advisors de seguridad no reportan problemas nuevos.
- [x] `npm run build` termina sin errores y `npm run lint` no reporta errores nuevos.
- [x] Con sesión de Juan (staff), `/kids` muestra el header "GESTIÓN / Niños", el botón "Agregar niño" y el estado vacío "No hay niños registrados todavía…" (sin secciones de salas).
- [x] Abrir "Agregar niño" muestra el modal con el select SALA con las 3 salas desde la DB (Soles preseleccionada).
- [x] Guardar "Martina López", fecha válida, sala Nubes → la tarjeta aparece en la sección "SALA NUBES · 1 niño"; al recargar `/kids` el niño sigue.
- [x] `select * from public.children` tiene 1 fila con `full_name = 'Martina López'`, `birth_date` correcto, `enrolled_at` = hoy, `allergy_tags` con los tags en inglés y `status = 'active'`.
- [x] Guardar con "Maní, Lactosa" en alergias muestra el badge "MANÍ, LACTOSA" en la tarjeta y guarda `allergy_tags = {peanut,lactose}`.
- [x] Con 0 niños, no hay errores en la consola; el buscador sigue funcionando cuando hay niños.
- [x] Click en la tarjeta de un niño real (ej. "Martina López") navega a `/kids/{id}` y el perfil muestra datos de la DB: nombre, edad, sala ("Sala Nubes"), fecha de nacimiento, ingreso y alergias, con "sin padres vinculados".
- [x] `/kids/{id}` con id inexistente muestra la página `notFound()` (404).
- [x] La tarjeta de un niño real navega (`<a href="/kids/{id}">`); el listado `/kids` no enlaza a `/kids/[slug]` (ruta removida).

## Decisions

- **Sí:** dos migraciones (tablas+seed / políticas). Mismo patrón de SPEC 09 (políticas separadas de las tablas).
- **Sí:** `room_id` NOT NULL — todo niño inscrito pertenece a una sala; el modal exige sala.
- **Sí:** políticas staff-only con `role = 'staff'` + misma `daycare_id` (join vía `rooms` para `children`). Los padres no leen ni escriben niños en este spec.
- **Sí:** `allergy_tags text[]` en inglés + `medical_notes`, según la referencia. Input libre parseado (el mockup es un input de texto); lo no reconocido cae a `medical_notes` en vez de inventar tags.
- **Sí:** `enrolled_at` = hoy y `photo_consent` = true al alta (no hay campos en el mockup).
- **Sí:** alta con INSERT desde el client (sesión en cookies) + `router.refresh()` para recargar el server component; la lista se renderiza desde el server, sin estado duplicado.
- **Sí:** tarjetas con navegación al perfil dinámico. `/kids/[slug]` (mock) se reemplaza por `/kids/[id]`: server component que lee `children` por uuid y el nombre de sala, `notFound()` si no existe; sin `generateStaticParams`. Los componentes de perfil se adaptan al tipo `Kid` de `kids-data` (`roomName`, `entryDate`).
- **Sí:** ParentsCard en el perfil real recibe `kidName` + `initialParents` (vacío desde DB); el estado local de padres persiste solo en memoria hasta que llegue `parent_children`.
- **Sí:** `KIDS` mock se conserva en `app/lib/kids.ts` (lo usa `create-post-modal`); se eliminan solo `ROOMS`/`buildKid`/etc. que quedaron sin uso.
- **Sí:** orden de salas Soles → Nubes → Estrellas vía `sortRooms` (el `order by name` daría Estrellas primero).
- **No:** CRUD de salas, edición/archivado de niños, seed de niños, rol Familia, vinculación real de padres. Van en sus propios specs.

## Risks

| Risk | Mitigation |
|---|---|
| Política con subconsulta a `users` puede fallar si el perfil no existe | El trigger de SPEC 08 crea el perfil al signup; el seed de Juan lo garantiza. |
| `router.refresh()` no actualiza el estado del client | La lista vive en props del server component; el refresh la re-renderiza con datos nuevos. |
| Alergia no mapeada se pierde | Se anexa a `medical_notes` ("Alergias: …") y queda visible en el perfil. |
| `list_tables` no muestra políticas con detalle | Se verifica con consulta a `pg_policies` si hace falta. |

## What is **not** in this spec

- Tablas restantes del esquema (`posts`, `parent_children`, `invitations`, …).
- Edición y archivo de niños (el perfil `/kids/[id]` es de lectura).
- Vinculación real de padres y CRUD de salas.
- Rol Familia y políticas de lectura para padres.
- Seed de niños de prueba.
- Eliminación del mock `KIDS` (lo usan otras pantallas).

Cada uno de esos puntos, si llega, va en su propio spec.
