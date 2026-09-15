# Tareas — Separar el panel del staff de la parte de la familia

## 1. DAL de rol

- [x] 1.1 Crear `app/lib/dal.ts` con `getProfile()` (React `cache()`; `auth.getUser()` + select de `users` con `id, full_name, role, avatar_url, daycare_id, daycares(name)`), `requireStaff()` (parent → redirect `/familia`; admin cuenta como staff; sin perfil → `notFound()`) y `requireParent()` (no-parent → redirect `/`; sin perfil → `notFound()`). Verificado con `npm run lint` sin errores nuevos.

## 2. Shell parametrizable

- [x] 2.1 Partir `app/components/layout/nav-items.tsx` en `STAFF_NAV_ITEMS` (Feed `/`, Niños `/kids`, Avisos `#`, Mi cuenta `#`) y `FAMILY_NAV_ITEMS` (Feed `/familia`, Resumen del día `#`, Mi cuenta `#`). Verificado con `npm run lint` y `grep` de que no queden imports de `NAV_ITEMS`.
- [x] 2.2 Parametrizar `Sidebar` y `BottomNav` con `items` + `variant` ("staff" | "family"): subtítulo "Familia" vs `profile?.daycare_name ?? ROOM.name`, etiqueta de rol ("Staff"/"Admin"/"Familia") y misma lógica de activo. Actualizar las 3 páginas actuales para pasar `STAFF_NAV_ITEMS` y `variant="staff"`. Verificado con `npm run build` y revisión visual de `/` y `/kids` con la sesión de staff.

## 3. Route group del staff

- [x] 3.1 Crear `app/lib/composer-data.ts` con `getComposerData()` cacheado (rooms ordenadas + niños activos por sala + conteo) reutilizando `AVATAR_PALETTE`/`sortRooms`/`mapChildRow`. Verificado con `npm run lint`.
- [x] 3.2 Crear `app/(staff)/layout.tsx`: shell staff (`Sidebar`/`BottomNav` con `STAFF_NAV_ITEMS`) + `<main>` + `CreatePostProvider` con `getComposerData()` y `canPost` según `getProfile()?.role === "staff"` (igual que hoy). Verificado con `npm run build`.
- [x] 3.3 Mover `app/page.tsx` a `app/(staff)/page.tsx`, quitando el shell y el `CreatePostProvider` (ahora vienen del layout) y usando `getComposerData()` para el conteo de niños. Verificado con `npm run build` y `/` renderiza el feed con sesión de staff.
- [x] 3.4 Mover `app/kids/page.tsx` y `app/kids/[id]/page.tsx` a `app/(staff)/kids/**` quitando el shell. Verificado con `npm run build` y navegación a `/kids` y a un perfil de niño con sesión de staff.
- [x] 3.5 Agregar `await requireStaff()` al inicio de las 3 páginas del grupo. Verificado en Playwright: con sesión de padre, `/`, `/kids` y `/kids/<id>` redirigen a `/familia`.

## 4. Feed compartido y área de familia

- [x] 4.1 Extraer el cuerpo del feed a `app/components/feed/feed-screen.tsx` (fetch de posts + signed URLs + render, sin shell ni provider) y usarlo desde `app/(staff)/page.tsx` reemplazando el fetch inline del perfil por `getProfile()`. Verificado con `npm run build` y `/` idéntico al actual (posts, fotos, audiencia, "publicado por vos").
- [x] 4.2 Crear `app/(family)/layout.tsx` con el shell de familia (`FAMILY_NAV_ITEMS`, `variant="family"`) y `<main>`. Verificado con `npm run build`.
- [x] 4.3 Crear `app/(family)/familia/page.tsx` con `await requireParent()` + `<FeedScreen />`. Verificado en Playwright: padre en `/familia` ve sus publicaciones, nav familia ("Familia" en sidebar y footer) y no ve composer ni "Nueva publicación".
- [x] 4.4 Verificar los redirects cruzados en Playwright: staff en `/familia` vuelve a `/`; padre en `/` y `/kids` va a `/familia`; admin (si se crea uno de prueba) se comporta como staff. Verificado con capturas en `.playwright-mcp/`.

## 5. Verificación integral

- [x] 5.1 `npm run lint` y `npm run build` terminan sin errores nuevos. Verificado con la salida de ambos comandos.
- [x] 5.2 Playwright staff (`juan@mail.cl` / `Abc123456`): nav del panel en `/` y `/kids` (Niños activo), "Nueva publicación" abre el modal desde `/kids` (antes era noop), Avisos `#` no rompe. Verificado con capturas en `.playwright-mcp/`.
- [x] 5.3 Playwright padre: resetear la contraseña de Pedro Torres o crear un padre de prueba; verificar `/familia` con feed, ítems `#` (Resumen del día, Mi cuenta) sin error y sin composer. Verificado con capturas en `.playwright-mcp/`.
- [x] 5.4 Verificar que `/login` y `/activar-cuenta` siguen sin shell de rol y accesibles sin sesión, y que un padre que inicia sesión termina en `/familia` (vía el redirect de `/`). Verificado con Playwright.
- [x] 5.5 Actualizar `README.md` (estructura de rutas staff vs `/familia`) y `AGENTS.md` si la separación cambia instrucciones vigentes. Verificado leyendo los diffs.

## 6. Cierre

- [x] 6.1 Correr `openspec validate separar-panel-staff-y-familia` y `openspec status` en verde. Verificado con la salida de ambos comandos.
