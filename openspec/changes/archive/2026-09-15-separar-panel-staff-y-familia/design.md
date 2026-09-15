# Diseño — Separar el panel del staff de la parte de la familia

## Context

Ver `proposal.md` — Why. Estado actual relevante para el "cómo":

- `Sidebar` y `BottomNav` se renderizan a mano en `app/page.tsx`, `app/kids/page.tsx` y `app/kids/[id]/page.tsx`, todos con el mismo `NAV_ITEMS`.
- `app/page.tsx` ya ramifica por rol (`isStaff`) para composer, "Para:" y header; el padre ve una versión degradada del feed del staff.
- `proxy.ts` valida solo sesión; no hay guard de rol. Un padre en `/kids` recibe la página vacía que devuelve la RLS.
- El rol vive en `public.users.role`, no en el JWT.
- `CreatePostProvider` solo existe en el feed; en `/kids` el botón "Nueva publicación" del sidebar es noop.
- Docs de Next 16 (`node_modules/next/dist/docs/01-app/02-guides/authentication.md`): el proxy es un chequeo optimista, los layouts no se re-renderizan en navegación ni bloquean el render del segmento; la autorización va cerca del dato (DAL).

## Goals / Non-Goals

**Goals:**

- Shell, navegación y área por rol con URLs estables (staff conserva las suyas).
- Guard de rol server-side confiable en cada entrada (carga directa y navegación cliente).
- Centralizar el shell duplicado y dejar el composer operativo en todo el panel.
- Cero cambios de contenido en el feed y cero cambios de RLS.

**Non-Goals:**

- Diseño del feed de familia del mockup (`familia-feed.dc.html`), RLS para que el padre lea `children`, `rooms` o perfiles de staff.
- `Mi cuenta` (staff y familia), `Resumen del día` (`daily_summaries`), `Avisos`.
- Refactor del composer a fetch client-side o rediseño del modal.
- Redirección post-login por rol (se evalúa como open question).

## Decisions

### 1. Route groups `(staff)` y `(family)`, familia en `/familia`

El staff conserva `/`, `/kids` y `/kids/[id]`; la familia estrena `/familia`. Los grupos permiten un layout propio por área y una nav estática por grupo (sin decidirla en cliente, sin flash).

Alternativas descartadas: shell por rol en la misma URL `/` (el nav depende del perfil en cliente y `/` termina ramificando dos diseños completos); prefijos simétricos `/panel` + `/familia` (rompe las URLs del staff ya documentadas en specs y pruebas).

### 2. Guards en las páginas con un DAL cacheado; proxy sin cambios

`app/lib/dal.ts` expone `getProfile()` (`auth.getUser()` + select de `users` con `cache()` de React), `requireStaff()` y `requireParent()` con `redirect()`. Cada página llama al guard que le corresponde; el layout no autoriza.

Por qué: los layouts no se re-renderizan en navegación cliente ni impiden que el segmento corra, así que un guard solo-layout deja huecos; el proxy no conoce el rol (vive en `public.users`, no en el JWT) y consultarlo por request agrega latencia sin ser la defensa recomendada. RLS sigue siendo la seguridad real; el guard es UX y defensa en profundidad.

Alternativas descartadas: proxy consultando `users.role`; guard únicamente en layouts.

### 3. Sesión sin perfil → `notFound()`

Redirigir a `/login` crearía un loop: el middleware manda a `/` a un autenticado que visita `/login`, y el guard lo devolvería a `/login`. Con `notFound()` el caso raro (sesión sin fila en `public.users`, que el trigger `handle_new_user` debería impedir) responde 404 sin loop.

### 4. `admin` se trata como staff

Hoy no hay usuarios admin, pero el enum existe y un admin pertenece a la guardería. Recibe shell y guards de staff. Un tercer shell no tiene usuarios que lo justifiquen.

### 5. Shell parametrizable y centralizado en layouts

`Sidebar` y `BottomNav` reciben `variant` ("staff" | "family") y eligen la lista (`STAFF_NAV_ITEMS`/`FAMILY_NAV_ITEMS`) dentro del propio componente cliente: los íconos son funciones y no se pueden pasar de un server component a un client component, así que la lista no viaja como prop. Subtítulo "Familia" vs `daycare_name ?? ROOM.name`, y etiqueta de rol ("Staff"/"Admin"/"Familia"). Los layouts `(staff)/layout.tsx` y `(family)/layout.tsx` pintan shell + `<main>`; cada página conserva su wrapper de ancho (`max-w-[760px]` feed, `max-w-[880px]` niños, `max-w-[820px]` perfil).

El bloque de usuario sigue client-side con `useUser()` (comportamiento actual); lo estático por grupo es la lista de ítems.

### 6. `CreatePostProvider` al layout staff, con datos en el layout

El botón "Nueva publicación" vive en el sidebar, así que el provider debe envolver al shell. `(staff)/layout.tsx` obtiene rooms + niños activos con un helper `getComposerData()` cacheado que el feed reutiliza para el conteo ("N niños"). Efecto colateral buscado: el botón deja de ser noop en `/kids` y `/kids/[id]`.

Trade-off: las páginas del panel pagan el fetch de rooms/children en el layout. Son datos chicos (3 salas / 4 niños hoy), el feed ya los pedía y `/kids` ya consultaba ambos.

Alternativa descartada: mantener el provider en el feed (conserva el botón muerto) o mover el fetch al cliente (refactor mayor del modal, fuera de alcance).

### 7. Feed compartido: `app/components/feed/feed-screen.tsx`

El cuerpo de `app/page.tsx` (fetch de posts + firmas + render) se extrae a un componente server que usan `/` y `/familia`. El branch `isStaff` queda intacto y resuelve solo según el rol de la ruta. Cero cambios de contenido.

Alternativa descartada: duplicar la página para familia (dos fuentes de verdad para el mismo feed).

### 8. Ítems sin pantalla quedan como `#`

Avisos (staff) y Resumen del día / Mi cuenta (familia) se muestran sin destino funcional, como ya hace Avisos hoy. Se implementan en specs futuros.

## Risks / Trade-offs

- [El layout staff hace `await` de datos y retrasa el primer chunk del segmento] → datos livianos y cacheados por request; si molesta, el composer puede pasar a fetch client-side en otro spec.
- [Tres llamadas a `requireStaff()` (layout implícito en cada página) podrían multiplicar queries] → `getProfile()` usa `cache()`; una sola ejecución por request.
- [Un padre con `/` en favoritos hace un hop extra a `/familia`] → aceptado; el login sigue yendo a `/` y el guard completa la redirección.
- [Credenciales del padre (Pedro Torres) no documentadas] → al verificar hay que resetear su contraseña o crear un padre de prueba antes de las pruebas de Playwright.
- [Ítems de nav sin destino pueden confundir] → ya visibles en los mockups; los specs de Avisos, Mi cuenta y Resumen del día los completan.
- [La lógica de ambos roles sigue conviviendo en `FeedScreen`] → aceptable en Nivel 1; cuando llegue el feed de familia del mockup, `(family)/familia` puede divergir sin tocar al staff.

## Migration Plan

No hay migración de datos ni de base de datos. Es un cambio de código: deploy normal y rollback revirtiendo el commit. Las URLs del staff no cambian; la única URL nueva es `/familia`.

## Open Questions

- ¿El login debería aterrizar directo en `/familia` para padres (evitando el hop por `/`)? Deferible: no cambia specs ni approach.
