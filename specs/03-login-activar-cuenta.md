# SPEC 03 — Login y activación de cuenta

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-06
> **Objetivo:** Implementar `/login` y `/activar-cuenta` idénticos a los mockups `references/pantallas/login.dc.html` y `references/pantallas/activar-cuenta.dc.html`, sin el selector de rol Personal/Familia y con navegación real hacia las pantallas que ya existen.

## Scope

**In:**

- Página `/login` con la estructura del mockup `login.dc.html`: columna izquierda con hero coral (logo, titular, descripción y pie "Guardería Sala Soles") y columna derecha con el formulario de acceso.
- Formulario de login **sin** la sección "INGRESO COMO" (sin botones Personal/Familia): email precargado `caro@opendaycare.com`, contraseña, "¿Olvidaste tu contraseña?" y botón "Iniciar sesión".
- Página `/activar-cuenta` con la estructura del mockup `activar-cuenta.dc.html`: tarjeta centrada (máx. 440px) con logo, "Bienvenida a OpenDayCare", tarjeta "Te invitaron a seguir a Mateo · Sala Soles", inputs (código `7K4P9`, email `lucia.fernandez@gmail.com`, contraseña), checkbox de autorización de fotos y botón "Activar mi cuenta".
- Navegación: "Iniciar sesión" → `/`; "Activá tu cuenta" → `/activar-cuenta`; "¿Ya tenés cuenta?" → `/login`; "¿Olvidaste tu contraseña?" y "Activar mi cuenta" → `#`.
- Sidebar: el botón "Cerrar sesión" pasa de `#` a `/login`.
- Responsive: en `<1024px` el hero se muestra compacto arriba y el formulario abajo (columna única).
- Nuevos colores de la paleta en `@theme` (`app/globals.css`).

**Out of scope (para futuros specs):**

- Autenticación real, sesiones o backend.
- Rol Familia y la pantalla `familia-feed.dc.html`.
- Recuperación de contraseña funcional.
- Validación de formularios o estados de error.
- Cualquier otra pantalla del mockup (mi-cuenta, etc.).

## Data model

Esta feature no introduce estructuras de datos nuevas. Los valores son estáticos en los componentes:

- Email login: `caro@opendaycare.com`.
- Invitación: código `7K4P9`, email `lucia.fernandez@gmail.com`, niño "Mateo · Sala Soles" (avatar `#A9D9E8` / `#1F7A93`).
- Sin persistencia: no se guarda nada entre sesiones.

## Implementation plan

1. `app/globals.css`: agregar al `@theme` los colores del mockup (crema-suave `#FBF4EC`, borde-input `#EADFD0`, verde-check `#5FB97E`, marfil `#FBF1D6`, marron-invitacion `#8A7234`).
2. `app/components/auth/login-hero.tsx`: columna izquierda del login (gradiente `#F6A98E → #F2937A → #EC7E62`, círculos decorativos, logo OpenDayCare, titular, descripción, pie de sala). Reutilizable tal cual en escritorio.
3. `app/components/auth/login-form.tsx`: formulario sin selector de rol (label EMAIL con input precargado, label CONTRASEÑA, "¿Olvidaste tu contraseña?" en `#`, botón "Iniciar sesión" como `Link` a `/`, pie con "Activá tu cuenta" → `/activar-cuenta`).
4. `app/login/page.tsx`: ensamblar hero + formulario en grid de 2 columnas (escritorio) y columna única (móvil, hero compacto arriba).
5. `app/components/auth/activate-form.tsx`: tarjeta de activación (logo con sombra, título, descripción, tarjeta de invitación con avatar M, inputs de código/email/contraseña, checkbox de autorización, botón "Activar mi cuenta" en `#`, pie "¿Ya tenés cuenta?" → `/login`).
6. `app/activar-cuenta/page.tsx`: página centrada con la tarjeta de activación.
7. `app/components/layout/sidebar.tsx`: cambiar el href de "Cerrar sesión" a `/login`.
8. Verificar con `npm run build` y comparación visual con Playwright (escritorio y móvil) contra los mockups.

## Acceptance criteria

- [x] `npm run build` termina sin errores.
- [x] `/login` muestra el hero izquierdo con logo "OpenDayCare", titular "El día de cada niño, compartido con su familia.", descripción y pie "🌿 Guardería Sala Soles".
- [x] `/login` NO muestra la sección "INGRESO COMO" ni los botones "Personal" y "Familia".
- [x] `/login` muestra el input EMAIL con `caro@opendaycare.com` precargado, el input CONTRASEÑA y el enlace "¿Olvidaste tu contraseña?" en `#`.
- [x] El botón "Iniciar sesión" navega a `/`.
- [x] El enlace "Activá tu cuenta" navega a `/activar-cuenta`.
- [x] `/activar-cuenta` muestra el logo, "Bienvenida a OpenDayCare", la descripción, la tarjeta "Te invitaron a seguir a Mateo · Sala Soles" con avatar M, los inputs (código `7K4P9`, email `lucia.fernandez@gmail.com`, contraseña) y el checkbox de autorización marcado.
- [x] El botón "Activar mi cuenta" es un enlace muerto (`#`).
- [x] El enlace "¿Ya tenés cuenta?" navega a `/login`.
- [x] En móvil (<1024px) `/login` se apila: hero compacto arriba y formulario abajo.
- [x] El botón "Cerrar sesión" del sidebar navega a `/login`.
- [x] No hay errores en la consola del navegador en ninguna de las rutas.

## Decisions

- **Sí:** Un solo spec para ambas pantallas. Son dos pantallas de autenticación pequeñas y relacionadas.
- **Sí:** Eliminar "INGRESO COMO" (Personal/Familia) por decisión del usuario. El email queda precargado con el valor del rol staff (`caro@opendaycare.com`).
- **Sí:** "Iniciar sesión" → `/`. El feed ya existe; la navegación es real.
- **Sí:** "Activar mi cuenta" → `#`. `familia-feed.dc.html` no está implementada; va en otro spec.
- **Sí:** "Cerrar sesión" del sidebar → `/login`. Integración natural con la nueva pantalla.
- **Sí:** Hero compacto arriba en móvil. Mantiene la identidad de marca; el mockup es solo escritorio.
- **No:** Autenticación, sesiones o backend. El botón de login solo navega.
- **No:** Rol Familia ni pantalla familia-feed. Van en su propio spec.

## Risks

| Risk                                                    | Mitigation                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------- |
| Los mockups son solo de escritorio                       | El responsive móvil es interpretación nuestra y se revisa en Playwright.  |
| Login sin validación puede confundir                      | Es el comportamiento acordado: sin backend todavía; la validación llega con la autenticación real. |

## What is **not** in this spec

- Autenticación, sesiones y backend.
- Rol Familia y pantalla familia-feed.
- Recuperación de contraseña funcional.
- Validación de formularios.

Cada uno de esos puntos, si llega, va en su propio spec.
