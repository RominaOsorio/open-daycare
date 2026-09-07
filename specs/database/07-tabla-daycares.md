# SPEC 07 — Tabla `daycares` (primera migración)

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-09-07
> **Objetivo:** Crear la primera tabla del esquema, `daycares`, en Supabase siguiendo la referencia `07-DB-Schema` y el patrón de migraciones timestamped, con RLS activado y un seed de la guardería para probar la UI.

## Scope

**In:**

- Tabla `public.daycares` con los campos de la referencia (`id uuid PK` default `gen_random_uuid()`, `name text NOT NULL`, `created_at timestamptz` default `now()`) más `address text` nullable agregado a pedido del usuario.
- RLS activado en la tabla (buena práctica en schemas expuestos), sin políticas todavía.
- Seed: 4 filas para probar la UI — `'Guardería Sala Soles'` más 3 guarderías ficticias, cada una con una `address` ficticia.
- Migración aplicada a Supabase con el patrón timestamped (`supabase_apply_migration`).
- Verificación: tabla, columnas, RLS, fila y registro de migración.

**Out of scope (para futuros specs):**

- Resto de las tablas del esquema (`users`, `rooms`, `children`, `posts`, etc.).
- Enums (`user_role`, `post_type`, …).
- Políticas RLS y grants al Data API (llegan con el spec de auth).
- Trigger `AFTER INSERT` en `auth.users`.
- Conexión de la UI a Supabase (el feed sigue con datos locales).
- `updated_at` (la referencia no lo incluye en `daycares`).

## Data model

`public.daycares` — DDL de la migración:

```sql
create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;

insert into public.daycares (name, address) values
  ('Guardería Sala Soles', 'Av. Los Pinos 1234, Santiago'),
  ('Jardín de Nube Azul', 'Calle Primavera 456, Providencia'),
  ('Guardería Estrellitas', 'Los Alerces 789, Ñuñoa'),
  ('Pequeños Exploradores', 'Camino Real 321, Las Condes');
```

Migración adicional (aplicada después, en `agregar_address_daycares`):

```sql
alter table public.daycares add column address text;

update public.daycares set address = case name
  when 'Guardería Sala Soles' then 'Av. Los Pinos 1234, Santiago'
  when 'Jardín de Nube Azul' then 'Calle Primavera 456, Providencia'
  when 'Guardería Estrellitas' then 'Los Alerces 789, Ñuñoa'
  when 'Pequeños Exploradores' then 'Camino Real 321, Las Condes'
end;
```

Convenciones:

- Identificadores en minúsculas; PK `uuid` con `gen_random_uuid()` (requiere `pgcrypto`, ya instalado).
- Todo lo persistido va en inglés; la etiqueta visible "Guardería Sala Soles" es dato, no enum.
- Sin `updated_at` ni `GRANT` a `anon`/`authenticated`: con RLS sin políticas la tabla queda inaccesible para el Data API (seguro por defecto).

## Implementation plan

1. Crear el spec `specs/07-tabla-daycares.md` (este archivo) y marcarlo `Approved` tras revisión.
2. Crear la rama `spec-07-tabla-daycares` desde `main`.
3. Aplicar la migración `crear_tabla_daycares` con `supabase_apply_migration` (crea tabla + RLS + seed en un paso atómico) y, a pedido del usuario, `agregar_address_daycares` (columna `address` + backfill).
4. Verificar con `list_tables` (columnas, RLS on, 4 filas), `list_migrations` y advisors de seguridad.

## Acceptance criteria

- [x] `list_migrations` muestra `crear_tabla_daycares` y `agregar_address_daycares` registradas.
- [x] `list_tables` muestra `public.daycares` con columnas `id` (uuid PK), `name` (text, NOT NULL), `address` (text, nullable) y `created_at` (timestamptz).
- [x] `daycares` tiene `rls_enabled: true`.
- [x] `select * from public.daycares` devuelve 4 filas, entre ellas `'Guardería Sala Soles'`, cada una con su `address` ficticia.
- [x] Los advisors de seguridad no reportan problemas en la tabla.

## Decisions

- **Sí:** Respeta la referencia tal cual (`id`, `name`, `created_at`) sin `updated_at`, aunque la convención general del doc menciona `created_at`/`updated_at`. La referencia manda.
- **Sí:** RLS activado sin políticas. Es la entidad raíz; las políticas llegan con el spec de auth. Deja la tabla inaccesible por el Data API (seguro).
- **Sí:** Seed con 4 filas (la guardería real + 3 ficticias) en la misma migración. Sirve para probar la UI cuando conectemos la lectura.
- **Sí:** `name` NOT NULL. Es el único dato obligatorio de una guardería.
- **Sí:** `address text` nullable, agregado a pedido del usuario (fuera de la referencia) con datos ficticios de prueba. Se mantiene nullable para no bloquear altas sin dirección.
- **Sí:** Una sola migración atómica (tabla + RLS + seed) con el patrón timestamped de Supabase, y una segunda migración para `address` (columna agregada después).
- **No:** Grants al Data API, enums, `updated_at`, otras tablas, trigger de auth.

## Risks

| Risk | Mitigation |
|---|---|
| La fila de seed queda huérfana cuando lleguen las políticas | El seed es de prueba; se ajusta o elimina cuando se conecte la UI de verdad. |
| Tabla inaccesible para la UI al no haber políticas | Es el estado esperado; la lectura de prueba se hace con el rol de servicio o vía SQL. |

## What is **not** in this spec

- El resto de las tablas del esquema.
- Enums.
- Políticas RLS y grants al Data API.
- Trigger de `auth.users`.
- Conexión de la UI con Supabase.
- `updated_at`.

Cada uno de esos puntos, si llega, va en su propio spec.
