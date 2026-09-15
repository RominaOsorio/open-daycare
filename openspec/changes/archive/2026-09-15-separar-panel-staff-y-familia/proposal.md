# Separar el panel del staff de la parte de la familia

## Why

Hoy staff y familias comparten la misma shell: un padre que inicia sesión ve la navegación del staff (Feed, Niños, Avisos, Mi cuenta), entra a `/kids` y la RLS le devuelve una página vacía, y no existe ningún guard de rol. Con padres reales ya vinculados (SPEC 12) y el feed publicando (SPEC 14), la app necesita separar la experiencia del panel del staff de la parte de la familia.

## What Changes

- Route groups `(staff)` y `(family)`: el panel del staff conserva `/`, `/kids` y `/kids/[id]`; la familia estrena `/familia` (feed con el contenido actual).
- Shell por rol: `Sidebar`/`BottomNav` parametrizables con `STAFF_NAV_ITEMS` (Feed, Niños, Avisos, Mi cuenta) y `FAMILY_NAV_ITEMS` (Feed, Resumen del día, Mi cuenta); subtítulo ("Familia" vs nombre de la guardería) y etiqueta de rol según variante.
- Guards de rol server-side con un DAL (`getProfile()` cacheado + `requireStaff()`/`requireParent()`): un padre que entra a `/` o `/kids` es redirigido a `/familia`; staff/admin que entra a `/familia` vuelve a `/`. `admin` se trata como staff.
- El shell se centraliza en layouts por grupo (hoy `Sidebar`/`BottomNav` están duplicados en 3 páginas) y `CreatePostProvider` pasa al layout staff, con lo que "Nueva publicación" deja de ser noop fuera del feed.
- El feed actual se extrae a un componente compartido (`FeedScreen`) que sirve `/` y `/familia` sin cambios de contenido.
- **Fuera de alcance** (specs futuros): el diseño del feed de familia del mockup (chips por hijo, tarjetas por hijo, RLS para que el padre lea `children`, `rooms` y perfiles de staff), `Mi cuenta` (staff y familia), `Resumen del día` (`daily_summaries`) y `Avisos`.

## Capabilities

### New Capabilities

- `role-based-shell`: navegación, shell y acceso por rol — shell staff en `/`, `/kids` y `/kids/[id]`; shell familia en `/familia`; redirects cruzados por rol; guards server-side por página.

### Modified Capabilities

_(ninguna: no hay specs OpenSpec existentes; los specs del repo en `specs/` son de otro flujo)_

## Impact

- Código: `app/page.tsx` y `app/kids/**` se mueven a `app/(staff)/**`; nuevos `app/(staff)/layout.tsx`, `app/(family)/layout.tsx`, `app/(family)/familia/page.tsx`, `app/lib/dal.ts` y `app/components/feed/feed-screen.tsx`; `app/components/layout/{nav-items,sidebar,bottom-nav}.tsx` parametrizados.
- Sin cambios: `proxy.ts` (sigue validando solo sesión), RLS, contenido del feed y `router.push("/")` del login (el guard completa la redirección del padre a `/familia`).
- Dependencia de verificación: credenciales del padre (Pedro Torres) para las pruebas de Playwright; hoy no están documentadas.
