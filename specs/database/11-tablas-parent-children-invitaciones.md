# SPEC 11 — Tablas `parent_children` e `invitations` (vínculos y códigos de invitación)

> **Estado:** Implementado
> **Depende de:** SPEC 08 (tabla `users`), SPEC 10 (tablas `rooms` y `children`)
> **Fecha:** 2026-09-12
> **Objetivo:** Crear los enums `relationship_type` e `invitation_status` y las tablas `parent_children` e `invitations` de la referencia `07-DB-Schema`, con RLS para staff y padres, sin conectar todavía la UI.

## Scope

**In:**

- Enum `public.relationship_type` (`father`, `mother`, `guardian`).
- Enum `public.invitation_status` (`pending`, `accepted`, `expired`, `cancelled`).
- Tabla `public.parent_children` según la referencia: `id uuid PK`, `parent_id uuid NOT NULL FK → users ON DELETE CASCADE`, `child_id uuid NOT NULL FK → children ON DELETE CASCADE`, `relationship relationship_type NOT NULL`, `created_at`, UNIQUE (`parent_id`, `child_id`).
- Tabla `public.invitations` según la referencia: `id uuid PK`, `child_id uuid NOT NULL FK → children ON DELETE CASCADE`, `invited_by uuid NOT NULL FK → users`, `full_name text NOT NULL`, `email text NOT NULL`, `relationship relationship_type NOT NULL`, `code text NOT NULL UNIQUE`, `status invitation_status NOT NULL default 'pending'`, `expires_at timestamptz NOT NULL default (now() + interval '7 days')`, `accepted_at timestamptz` nullable, `created_at`.
- RLS activado en ambas tablas.
- Índices: `parent_children_child_id_idx`, `invitations_child_id_idx`, `invitations_invited_by_idx` e `invitations_email_lower_idx` (funcional sobre `lower(email)`).
- Políticas RLS `to authenticated`:
  - `parent_children_select_staff` e `invitations_select_staff`: staff de la misma guardería del niño (join `children` → `rooms`).
  - `invitations_insert_staff`: staff, `invited_by = auth.uid()` y niño de su guardería.
  - `parent_children_select_own`: `parent_id = auth.uid()`.
  - `invitations_select_own`: email propio (case-insensitive) contra el claim `email` del JWT.
- Migraciones versionadas aplicadas con `supabase_apply_migration` + archivos en `supabase/migrations/`.

**Out of scope (para futuros specs):**

- Funciones RPC `get_invitation_info` / `accept_invitation` y activación de cuenta en `/activar-cuenta` (SPEC 09 las dejó pendientes).
- Conectar la UI: el modal "Vincular padre" (SPEC 05) y `ParentsCard` del perfil (SPEC 10) siguen en memoria / vacíos.
- Cancelación, expiración o reenvío de invitaciones (políticas UPDATE/DELETE, jobs).
- Política de lectura de `public.users` para que el staff vea los nombres de los padres (`users_select_own` sigue siendo la única).
- Generación/validación de códigos y envío de correo.
- Seed de datos de prueba.
- Rol Familia (feed del padre).

## Data model

Tres migraciones. La primera crea enums, tablas, RLS e índices:

```sql
create type public.relationship_type as enum ('father', 'mother', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  invited_by uuid not null references public.users(id),
  full_name text not null,
  email text not null,
  relationship public.relationship_type not null,
  code text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.parent_children enable row level security;
alter table public.invitations enable row level security;

create index parent_children_child_id_idx on public.parent_children (child_id);
create index invitations_child_id_idx on public.invitations (child_id);
create index invitations_invited_by_idx on public.invitations (invited_by);
create index invitations_email_lower_idx on public.invitations (lower(email));
```

La segunda agrega las políticas RLS:

```sql
create policy "parent_children_select_staff" on public.parent_children
  for select to authenticated
  using (
    (select role from public.users where id = (select auth.uid())) = 'staff'
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id
        and r.daycare_id = (select daycare_id from public.users where id = (select auth.uid()))
    )
  );

create policy "parent_children_select_own" on public.parent_children
  for select to authenticated
  using (parent_id = (select auth.uid()));

create policy "invitations_select_staff" on public.invitations
  for select to authenticated
  using (
    (select role from public.users where id = (select auth.uid())) = 'staff'
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id
        and r.daycare_id = (select daycare_id from public.users where id = (select auth.uid()))
    )
  );

create policy "invitations_insert_staff" on public.invitations
  for insert to authenticated
  with check (
    (select role from public.users where id = (select auth.uid())) = 'staff'
    and invited_by = (select auth.uid())
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id
        and r.daycare_id = (select daycare_id from public.users where id = (select auth.uid()))
    )
  );

create policy "invitations_select_own" on public.invitations
  for select to authenticated
  using (lower(email) = lower((select auth.jwt()) ->> 'email'));
```

La tercera corrige `invitations_select_own` para que el linter `auth_rls_initplan` reconozca el `select` (envuelve solo la función y no la expresión completa):

```sql
alter policy "invitations_select_own" on public.invitations
  using (lower(email) = lower((select auth.jwt()) ->> 'email'));
```

Convenciones:

- Todo lo persistido va en inglés; las etiquetas UI (fuera de este spec) traducen `father` → Papá, `mother` → Mamá, `guardian` → Tutor/a.
- `code`: 5 caracteres alfanuméricos en mayúsculas (generado por la UI en otro spec); UNIQUE garantiza no repetirlo.
- `expires_at` por defecto a 7 días, igual que el texto "Vence en 7 días" del modal de SPEC 05.
- `accepted_at` queda nullable y sin default; lo llenará el flujo de activación.
- Los emails se comparan case-insensitive con `lower()` en la política y su índice funcional.
- `invited_by` no lleva cascada: borrar un usuario staff no debe borrar el historial de invitaciones.
- El UNIQUE (`parent_id`, `child_id`) ya indexa `parent_id` como primera columna; no se crea un índice extra para esa FK.

## Implementation plan

1. Aplicar la migración `crear_tablas_parent_children_invitaciones` con `supabase_apply_migration` (enums + tablas + RLS + índices, atómico) y guardar el archivo en `supabase/migrations/<timestamp>_crear_tablas_parent_children_invitaciones.sql`.
2. Aplicar la migración `agregar_politicas_rls_parent_children_invitaciones` y guardar el archivo en `supabase/migrations/<timestamp>_agregar_politicas_rls_parent_children_invitaciones.sql`.
3. Aplicar la migración `fix_invitations_select_own_jwt_initplan` (ALTER POLICY de `invitations_select_own` con `(select auth.jwt())`) y guardar el archivo en `supabase/migrations/<timestamp>_fix_invitations_select_own_jwt_initplan.sql`.
4. Verificar con `list_migrations`, `list_tables` (columnas, RLS), `pg_enum` (valores), `pg_constraint`/`pg_indexes` (UNIQUE, FKs, índices), `pg_policies` (5 políticas) y advisors de seguridad y performance.
5. Prueba funcional de RLS en una transacción con `rollback` (no deja datos): con claims de Juan (staff) se ven las filas de su guardería; con claims de un padre solo su vínculo; con un `authenticated` ajeno no se ve nada. Confirmar que ambas tablas quedan vacías.

## Acceptance criteria

- [x] `list_migrations` registra `crear_tablas_parent_children_invitaciones`, `agregar_politicas_rls_parent_children_invitaciones` y `fix_invitations_select_own_jwt_initplan`.
- [x] Existen los enums `public.relationship_type` (`father`, `mother`, `guardian`) y `public.invitation_status` (`pending`, `accepted`, `expired`, `cancelled`) con exactamente esos valores.
- [x] `list_tables` muestra `public.parent_children` (id, parent_id, child_id, relationship, created_at) con `rls_enabled: true`.
- [x] `list_tables` muestra `public.invitations` (id, child_id, invited_by, full_name, email, relationship, code, status, expires_at, accepted_at, created_at) con `rls_enabled: true`.
- [x] `parent_children` tiene UNIQUE (`parent_id`, `child_id`) y FKs a `users` y `children` con `on delete cascade`.
- [x] `invitations` tiene UNIQUE en `code`; FK `child_id` → `children` con cascade; FK `invited_by` → `users` sin cascade; `status` default `pending` y `expires_at` default `now() + interval '7 days'`.
- [x] Existen los índices `parent_children_child_id_idx`, `invitations_child_id_idx`, `invitations_invited_by_idx` e `invitations_email_lower_idx`.
- [x] `pg_policies` muestra las 5 políticas: `parent_children_select_staff`, `parent_children_select_own`, `invitations_select_staff`, `invitations_insert_staff` e `invitations_select_own`, todas `to authenticated`.
- [x] `authenticated` tiene grants de SELECT/INSERT sobre ambas tablas y `anon` no tiene políticas.
- [x] Prueba funcional con `begin … rollback`: impersonando a Juan (staff) se ven invitaciones y vínculos de niños de su guardería; impersonando a un padre con su `sub` se ve solo su fila de `parent_children`; con un `sub` ajeno no se ve ninguna fila.
- [x] `select count(*)` de `public.parent_children` y `public.invitations` = 0 (sin seed).
- [x] Los advisors de seguridad no reportan problemas nuevos.
- [x] Los advisors de performance no reportan `auth_rls_initplan` en `public.invitations` (los `multiple_permissive_policies` e `unused_index` de las tablas nuevas son esperados: políticas separadas por rol y tablas vacías).

## Decisions

- **Sí:** dos migraciones (tablas + índices / políticas), mismo patrón de SPEC 09 y SPEC 10.
- **Sí:** `on delete cascade` en `parent_children` (tabla intermedia) y en `invitations.child_id`; `invited_by` sin cascada para preservar el historial de invitaciones.
- **Sí:** sin índice extra para `parent_children.parent_id`: el UNIQUE (`parent_id`, `child_id`) ya lo cubre como primera columna.
- **Sí:** los padres leen lo propio: `parent_children` por `parent_id = auth.uid()` e `invitations` por el claim `email` del JWT (case-insensitive con `lower()`).
- **Sí:** el staff lee invitaciones y vínculos de los niños de su guardería; el INSERT de invitaciones valida `invited_by = auth.uid()` y que el niño pertenezca a su guardería (el intento revertido de SPEC 11 no validaba la guardería).
- **Sí:** `auth.uid()`/`auth.jwt()` envueltos en `(select ...)` e índice funcional `lower(email)` para el rendimiento de RLS.
- **Sí:** `(select auth.jwt()) ->> 'email'` (envolviendo solo la función) en lugar de `(select auth.jwt() ->> 'email')`: el linter `auth_rls_initplan` busca el substring `select auth.jwt()` en `pg_policies.qual` y solo reconoce la primera forma; ambas generan el InitPlan.
- **Sí:** `expires_at` default 7 días, alineado con "Vence en 7 días" de SPEC 05.
- **No:** funciones RPC, activación de cuenta, conexión de UI, DELETE/UPDATE de invitaciones, seed, generación de códigos.
- **No:** política de lectura de `public.users` para staff: mostrar el nombre real de los padres en `ParentsCard` necesita esa política y llega con el spec de UI de vinculación.

## Risks

| Risk | Mitigation |
|---|---|
| `invitations_select_own` depende del claim `email` del JWT; si el usuario cambia de email pierde visibilidad de invitaciones viejas | Documentado; el flujo de activación usará una RPC `security definer` en su propio spec. |
| `invited_by` sin cascada puede bloquear el borrado de un usuario staff | El producto archiva usuarios, no los borra; si se necesita borrado, se decide en otro spec. |
| La prueba funcional RLS necesita filas temporales | Se ejecuta dentro de `begin … rollback`; las tablas quedan vacías y sin seed. |
| Nombres de migración parecidos a los del intento revertido | Se usan nombres nuevos (`crear_tablas_parent_children_invitaciones`); `list_migrations` registra versiones nuevas. |

## What is **not** in this spec

- Funciones RPC (`get_invitation_info`, `accept_invitation`) y activación de cuenta con código.
- Conexión de la UI: modal "Vincular padre", `ParentsCard` y `/activar-cuenta`.
- Cancelación, expiración o reenvío de invitaciones (UPDATE/DELETE).
- Política de lectura de `public.users` para staff.
- Generación de códigos, envío de correo y seed.
- Rol Familia y feed del padre.

Cada uno de esos puntos, si llega, va en su propio spec.
