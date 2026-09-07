# SPEC 08 — Tabla `users` y enums de usuario (seed staff)

> **Estado:** Implementado
> **Depende de:** SPEC 07 (tabla `daycares`)
> **Fecha:** 2026-09-07
> **Objetivo:** Crear la tabla `users` con los enums `user_role` y `user_status`, el trigger que crea el perfil al registrarse en Supabase Auth y un usuario staff real para probar.

## Scope

**In:**

- Enums `public.user_role` (`staff`, `parent`, `admin`) y `public.user_status` (`pending`, `active`).
- Tabla `public.users` según la referencia `07-DB-Schema`: `id uuid PK` FK → `auth.users(id)` ON DELETE CASCADE, `daycare_id uuid` FK → `public.daycares(id)` **nullable**, `role` default `'parent'`, `status` default `'active'`, `full_name text NOT NULL`, `avatar_url text` nullable, `notify_on_post boolean` default `true`, `daily_summary_enabled boolean` default `true`, `created_at`/`updated_at`.
- RLS activado en `users` sin políticas (patrón de SPEC 07).
- Función trigger `public.handle_new_user()` (SECURITY DEFINER, `set search_path = ''`) + trigger `on_auth_user_created` AFTER INSERT en `auth.users` FOR EACH ROW: crea el perfil con `id`, `full_name`, `daycare_id` y `role` desde `raw_user_meta_data`. `revoke execute` de `public`, `anon` y `authenticated`.
- Trigger `set_updated_at` para mantener `updated_at` en updates.
- Seed: 1 usuario staff real en `auth.users` (`juan@mail.cl`, contraseña `Abc123456` en bcrypt, email confirmado, vinculado a "Guardería Sala Soles"). El trigger crea su perfil en `public.users`.
- Migración timestamped aplicada con `supabase_apply_migration` + archivo en `supabase/migrations/`.

**Out of scope (para futuros specs):**

- Los demás enums (`relationship_type`, `invitation_status`, `post_type`, `child_status`) — llegan con sus tablas.
- Políticas RLS y grants al Data API (spec de auth).
- Conexión de la UI y login (spec 03).
- Resto de las tablas (`rooms`, `children`, `posts`, …).

## Data model

DDL de la migración `crear_tabla_usuarios`:

```sql
create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  daycare_id uuid references public.daycares(id),
  role public.user_role not null default 'parent',
  status public.user_status not null default 'active',
  full_name text not null,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, full_name, daycare_id, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'daycare_id', '')::uuid,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'parent')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();
```

Seed del usuario staff (misma migración; el trigger crea el perfil):

```sql
insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token,
  email_change_token_new, email_change,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'juan@mail.cl',
  extensions.crypt('Abc123456', extensions.gen_salt('bf')),
  now(),
  '', '', '', '',
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object(
    'full_name', 'Juan Herrera',
    'role', 'staff',
    'daycare_id', (select id from public.daycares where name = 'Guardería Sala Soles')
  ),
  now(), now()
);
```

Convenciones:

- Identificadores en minúsculas; PK `uuid` con `gen_random_uuid()`.
- Todo lo persistido en inglés; "Guardería Sala Soles" es dato del seed de SPEC 07.
- `pgcrypto` vive en el schema `extensions` → `extensions.crypt` / `extensions.gen_salt` explícitos.
- `role`/`daycare_id` se transportan en `raw_user_meta_data` (según la referencia) pero la fuente de verdad para authz será `public.users.role`; nunca se usan claims de metadata en políticas RLS.
- Token columns de `auth.users` se insertan como `''` para evitar el error de scan de `confirmation_token NULL`.

## Implementation plan

1. Crear el spec `specs/08-tabla-usuarios.md` (este archivo) y marcarlo `Aprobado` tras revisión.
2. Crear la rama `spec-08-tabla-usuarios` desde `main`.
3. Aplicar la migración `crear_tabla_usuarios` con `supabase_apply_migration` (enums + tabla + RLS + triggers + seed auth user, atómico) y guardar el archivo en `supabase/migrations/<timestamp>_crear_tabla_usuarios.sql`.
4. Verificar con `list_migrations`, `list_tables`, consulta de enums y de `auth.users`/`public.users`, y advisors de seguridad.

## Acceptance criteria

- [x] `list_migrations` registra `crear_tabla_usuarios`.
- [x] Existen los enums `user_role` (`staff`, `parent`, `admin`) y `user_status` (`pending`, `active`) en `public`.
- [x] `list_tables` muestra `public.users` con `id` (uuid PK), `daycare_id` (uuid, nullable), `role`, `status`, `full_name` (text NOT NULL), `avatar_url` (nullable), `notify_on_post`, `daily_summary_enabled`, `created_at` y `updated_at`, con `rls_enabled: true`.
- [x] `select count(*) from auth.users` = 1 (email `juan@mail.cl`, `email_confirmed_at` no null, `encrypted_password` no vacío).
- [x] `select count(*) from public.users` = 1, con `id` = id de auth, `role = 'staff'`, `status = 'active'`, `full_name = 'Juan Herrera'` y `daycare_id` = id de "Guardería Sala Soles".
- [x] `revoke execute` aplicado: `handle_new_user` no es ejecutable por `anon`/`authenticated`.
- [x] Los advisors de seguridad no reportan problemas nuevos.

## Decisions

- **Sí:** solo `user_role` y `user_status` en este spec. Los demás enums llegan con sus tablas (un enum sin tabla es deuda).
- **Sí:** trigger `handle_new_user` + `on_auth_user_created`, patrón oficial de Supabase (`security definer`, `set search_path = ''`), leyendo de `raw_user_meta_data` como indica la referencia. Nota de seguridad: no se usan claims de metadata para authz; `public.users.role` es la fuente de verdad.
- **Sí:** `revoke execute` sobre `handle_new_user` de `public`/`anon`/`authenticated`. Es una función de trigger, no un endpoint público.
- **Sí:** seed de usuario real con INSERT directo en `auth.users` + `extensions.crypt`. La doc oficial prefiere el Admin API, pero no es reproducible en una migración versionada; el seed placeholder sin contraseña no permite login. Columnas verificadas contra el `auth.users` actual del proyecto y token columns en `''`.
- **Sí:** `daycare_id` nullable — un `admin` global no pertenece a una guardería.
- **Sí:** `role` NOT NULL default `'parent'` (el signup típico es un padre; staff/admin se asignan por metadata).
- **Sí:** `updated_at` con trigger `set_updated_at` (la referencia incluye la columna para `users`).
- **No:** políticas RLS, grants al Data API, otros enums/tablas, trigger de sincronización UI, login.

## Risks

| Risk | Mitigation |
|---|---|
| Trigger con error bloquea todos los signups | Función mínima y validada con el seed (el trigger se crea después de la tabla). |
| INSERT directo en `auth.users` frágil ante versiones futuras de Auth | Columnas inspeccionadas de la versión instalada; token columns en `''`; si Auth cambia, la migración falla explícitamente y se ajusta. |
| Re-ejecución de la migración duplica el seed | `apply_migration` solo se aplica una vez; el email `juan@mail.cl` es único en `auth.users`. |

## What is **not** in this spec

- Los demás enums y tablas del esquema.
- Políticas RLS y grants al Data API.
- UI, login y conexión de la app a Supabase.
- Trigger de sincronización de perfil con la UI.

Cada uno de esos puntos, si llega, va en su propio spec.
