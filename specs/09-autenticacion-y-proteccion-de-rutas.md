# SPEC 09 — Autenticación con Supabase y protección de rutas

> **Estado:** Implementado
> **Depende de:** SPEC 03 (pantallas de login), SPEC 08 (tabla `users` + seed staff)
> **Fecha:** 2026-09-07
> **Objetivo:** Implementar autenticación real (email + password) contra Supabase Auth en `/login`, logout desde el sidebar y protección de rutas con `proxy.ts`, mostrando el perfil real del usuario en la UI.

## Scope

**In:**

- Login real en `/login`: `signInWithPassword` con campos vacíos (placeholders), estado de loading en el botón y mensaje de error "Email o contraseña incorrectos." sin recargar.
- Al loguear con éxito: redirección a `/` (feed) con `router.push` + `router.refresh()`.
- Logout real desde el sidebar: botón que ejecuta `signOut()` y navega a `/login`.
- Protección de rutas en `utils/supabase/middleware.ts` (usado por `proxy.ts`): sin sesión → redirect a `/login`; con sesión en `/login` → redirect a `/`.
- Rutas públicas: `/login` y `/activar-cuenta`. Todo lo demás queda protegido (patrón negativo en el matcher existente).
- Perfil real en la UI: `UserProvider` (client) con `auth.getUser()` + `select` de `public.users`; el sidebar y el saludo del home muestran `full_name`/rol reales (fallback mientras carga).
- Migración con políticas RLS en `public.users`: lectura y edición del propio perfil.

**Out of scope (para futuros specs):**

- Signup real en `/activar-cuenta` (necesita la tabla de invitaciones y validación de código).
- Rol Familia y pantalla `familia-feed.dc.html`.
- Recuperación de contraseña funcional ("¿Olvidaste tu contraseña?" sigue en `#`).
- Políticas RLS del resto de tablas (`daycares`, `rooms`, `kids`, `posts`…) — llegan con sus specs de persistencia.
- Conectar el autor de los posts/composer (`USER` en `lib/data.ts`) con datos reales.
- Redirección `?next=` (post-login siempre a `/`).
- Guard server-side (`DAL`/`requireUser`) — las páginas aún no hacen fetch de datos en el servidor.

## Data model

Perfil que se consume desde Supabase (fuente: `public.users`, política propia):

```ts
interface Profile {
  id: string;
  full_name: string;
  role: "staff" | "parent" | "admin";
  avatar_url: string | null;
  daycare_id: string | null;
}
```

Contexto expuesto por `UserProvider`:

```ts
const { user, profile, loading } = useUser();
// user: User | null  (Supabase Auth)
// profile: Profile | null
// loading: boolean
```

DDL de la migración `agregar_politicas_rls_users`:

```sql
create policy "users_select_own" on public.users
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "users_update_own" on public.users
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
```

Verificado: `authenticated` ya tiene grants de SELECT/UPDATE sobre `public.users` (solo faltaban las políticas RLS).

## Implementation plan

1. Aplicar la migración `agregar_politicas_rls_users` (2 políticas) con `supabase_apply_migration` y guardar el archivo en `supabase/migrations/<timestamp>_agregar_politicas_rls_users.sql`. Verificar con `list_migrations` y `list_tables` (policies visibles).
2. `app/components/user/user-provider.tsx`: provider client con `useUser()` que hace `auth.getUser()` + `from('users').select('*').eq('id', user.id).single()` con el client de `utils/supabase/client.ts`. Montarlo en `app/layout.tsx` envolviendo `{children}`.
3. `app/components/layout/sidebar.tsx`: usar `useUser()` para avatar/nombre/rol (inicial = primera letra de `full_name`, colores de fallback actuales mientras `loading`); convertir el `<a href="/login">` de "Cerrar sesión" en botón que ejecuta `signOut()` y luego `router.push("/login")` + `router.refresh()`.
4. `app/components/user/home-greeting.tsx`: componente client que muestra "Buenas, {primer nombre del perfil}" (fallback mientras carga). Usarlo en `app/page.tsx` en lugar de `USER.name.split(" ")[0]`.
5. `app/components/auth/login-form.tsx`: formulario controlado (email y contraseña vacíos con placeholder), submit async con `signInWithPassword`, botón con estado de loading, mensaje de error fijo "Email o contraseña incorrectos." y navegación a `/` al éxito. Quitar el `defaultValue` de `caro@opendaycare.com`.
6. `utils/supabase/middleware.ts`: en `updateSession`, tras `getUser()`, si no hay usuario y el pathname no es `/login` ni `/activar-cuenta` → `NextResponse.redirect(new URL('/login', request.url))`; si hay usuario y el pathname es `/login` → redirect a `/`. Devolver esa respuesta.
7. Verificación: `npm run lint`, `npm run build` y pruebas manuales con Playwright (login con `juan@mail.cl` / `Abc123456`, acceso anónimo a `/`, logout).

## Acceptance criteria

- [x] `npm run build` termina sin errores y `npm run lint` no reporta errores nuevos.
- [x] Sin sesión, `/` y `/kids/*` redirigen a `/login`.
- [x] Con sesión activa, visitar `/login` redirige a `/`.
- [x] `/login` y `/activar-cuenta` son accesibles sin sesión.
- [x] Los campos de login están vacíos (email con placeholder, contraseña con placeholder); ya no aparece `caro@opendaycare.com` precargado.
- [x] Login con `juan@mail.cl` / `Abc123456` entra al feed `/` y muestra "Buenas, Juan" en el home.
- [x] Login con credenciales incorrectas muestra "Email o contraseña incorrectos." sin recargar la página.
- [x] El botón "Iniciar sesión" muestra estado de loading mientras el request está en curso.
- [x] El sidebar muestra el nombre y rol reales del perfil (Juan Herrera · staff) y el avatar con su inicial.
- [x] "Cerrar sesión" ejecuta `signOut()`: vuelve a `/login` y `/` vuelve a redirigir a `/login`.
- [x] `list_migrations` registra `agregar_politicas_rls_users` y `list_tables` muestra las políticas `users_select_own` y `users_update_own` en `public.users`.
- [x] Con la sesión de Juan, `from('users').select('*').eq('id', <su id>)` devuelve su fila (política select propia activa).
- [x] No hay errores en la consola del navegador en `/login` ni en el feed.

## Decisions

- **Sí:** proteger desde `proxy.ts` con redirect según sesión (patrón oficial de `@supabase/ssr` + doc de Next 16). Nota: la doc de Next advierte verificar auth también dentro de cada server component a futuro (DAL) cuando las páginas hagan fetch de datos — queda anotado, no entra en este spec.
- **Sí:** redirección post-login siempre a `/` (decisión del usuario; sin `?next=`).
- **Sí:** `UserProvider` montado en el layout raíz (client). Se consideró un route group `(app)` con layout de shell compartido y se descartó: llega con el refactor de shell, no con auth.
- **Sí:** políticas RLS mínimas (select/update del propio perfil). El rol `staff` tendrá políticas de lectura más amplias en los specs de persistencia.
- **Sí:** mensaje de error fijo en español. No se exponen mensajes crudos de Supabase en la UI.
- **Sí:** se mantiene `USER` en `app/lib/data.ts` porque el composer y el modal de publicación lo usan como autor de posts locales.
- **No:** signup real en `/activar-cuenta` (sin tabla de invitaciones todavía).
- **No:** `?next=`, protección por rol, DAL server-side.

## Risks

| Risk | Mitigation |
|---|---|
| El proxy se ejecuta en el edge; dependencias de Node pesadas lo rompen | El proxy solo usa `@supabase/ssr` (ya implementado) y `getUser()`, sin imports de Node. |
| Páginas prerenderizadas en build (SSG) | El perfil se carga en el cliente; las páginas siguen estáticas y el proxy redirige antes de renderizar. |
| RLS sin política rompe el fetch del perfil (error 403) | La migración se aplica y verifica antes de tocar la UI; el fetch valida el error y cae al fallback. |
| Olvido de las credenciales del seed | Seed documentado en SPEC 08: `juan@mail.cl` / `Abc123456`. |

## What is **not** in this spec

- Signup real y validación de código de invitación (`/activar-cuenta`).
- Rol Familia, recuperación de contraseña.
- RLS del resto de tablas y datos reales de posts/kids.
- `?next=`, guard server-side (DAL), protección por rol.

Cada uno de esos puntos, si llega, va en su propio spec.
