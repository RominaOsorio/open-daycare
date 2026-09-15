# OpenDayCare

App web de una guardería: el feed de publicaciones para las familias, la gestión de niños, los avisos de la sala y la cuenta del usuario.

Construido con [Next.js 16](https://nextjs.org) (App Router), React 19, TypeScript y Tailwind CSS v4, con [Supabase](https://supabase.com) como backend (auth, Postgres y Storage).

## Stack

- **Next.js 16.3.4** (App Router) + React 19 + TypeScript.
- **Tailwind CSS v4** (CSS-first): la paleta vive en `app/globals.css` con `@theme`; no hay `tailwind.config.*`.
- **Fuentes:** Fredoka y Nunito cargadas con `next/font/google` en `app/layout.tsx`.
- **Supabase:** backend de auth, base de datos (Postgres + RLS) y Storage (bucket privado `post-photos` para las fotos del feed, servidas con signed URLs). Esquema aplicado con migraciones versionadas en `supabase/migrations/`; referencia del schema en `07-DB-Schema/`.
- **Clientes Supabase:** la app interactúa con la base de datos usando los paquetes oficiales para Next.js — `@supabase/supabase-js` + `@supabase/ssr`. Los helpers viven en `utils/supabase/` (`server.ts`, `client.ts`, `middleware.ts`) y `proxy.ts` en la raíz refresca la sesión en cada request (Next 16 renombró `middleware` a `proxy`). Env vars: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local`.
- Alias de rutas: `@/*` apunta a la raíz del repo (no hay `src/`).

## Getting Started

```bash
npm install
cp .env.example .env.local   # completá SUPABASE_DB_PASSWORD (en .env) y las NEXT_PUBLIC_* (en .env.local)
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) para ver la app.

## Commands

| Comando            | Descripción                              |
| ------------------ | ---------------------------------------- |
| `npm run dev`      | Servidor de desarrollo                   |
| `npm run build`    | Build de producción (verifica tipos)     |
| `npm run start`    | Sirve el build de producción             |
| `npm run lint`     | ESLint                                   |

No hay framework de tests ni script de typecheck: `next build` es la verificación completa más cercana.

## Estructura

```
app/
  layout.tsx          # Layout raíz: fuentes, metadata, lang="es"
  globals.css         # Paleta del mockup en @theme + estilos base
  (staff)/            # Panel del staff: shell + feed (/), niños (/kids, /kids/[id])
  (family)/           # Área de familia: shell + feed (/familia)
  login/              # Login real con Supabase Auth
  activar-cuenta/     # Activación real con código de invitación
  actions/            # Server actions (invitaciones, publicaciones)
  lib/                # Datos y helpers (data.ts, dal.ts, composer-data.ts, posts.ts, …)
  components/
    icons.tsx         # Iconos SVG inline
    ui/               # Piezas reutilizables (Avatar, Tag)
    layout/           # Sidebar y barra inferior de navegación (variantes staff | familia)
    feed/             # Feed compartido (feed-screen), composer, modal de publicación con fotos
    kids/             # Listado, alta, perfil y vinculación de padres
    auth/             # Formularios de login y activación
    user/             # Perfil del usuario (UserProvider, saludo)
supabase/
  migrations/         # Migraciones SQL versionadas (tablas, RLS, seeds)
references/
  pantallas/*.dc.html # Mockups HTML (fuente de verdad del diseño)
  screenshots/        # Capturas de referencia
utils/
  supabase/           # Clientes Supabase (server, client, middleware)
proxy.ts              # Refresca la sesión en cada request (Next 16)
specs/                # Especificaciones (database/ para las de base de datos)
openspec/             # Changes de OpenSpec (propuesta, specs, design y tasks)
```

Las rutas se separan por rol con route groups: el panel del staff conserva `/`, `/kids` y `/kids/[id]`; la familia vive en `/familia`. Cada página valida el rol con el DAL (`app/lib/dal.ts`): un padre que entra al panel va a `/familia`, y staff/admin que entra a `/familia` vuelve a `/`.

## Diseño

La fuente de verdad del diseño son los mockups de `references/pantallas/*.dc.html` y las capturas de `references/screenshots/`. Las pantallas se construyen para coincidir con ellos (paleta, tipografía, layout y responsive).

## Especificaciones

El desarrollo es spec-driven: cada funcionalidad se especifica en `specs/` (descripción, alcance, modelo de datos y plan de implementación) y se implementa por partes. Estado actual:

| Spec | Funcionalidad | Estado |
| ---- | ------------- | ------ |
| 01 | Home: feed de publicaciones (`/`) | Implementado |
| 02 | Niños: listado y perfil | Implementado |
| 03 | Login y activación de cuenta (`/login`, `/activar-cuenta`) | Implementado |
| 04 | Agregar niño (modal desde `/kids`) | Implementado |
| 05 | Vincular padre (modal desde el perfil) | Implementado |
| 06 | Crear publicación (modal en `/`) | Implementado |
| 07 | DB: tabla `daycares` con seed | Implementado |
| 08 | DB: tabla `users`, enums y trigger de perfil | Implementado |
| 09 | Autenticación real y protección de rutas | Implementado |
| 10 | DB + UI: salas y niños (`/kids`, `/kids/[id]`) | Implementado |
| 11 | DB: vínculos `parent_children` e `invitations` (RLS) | Implementado |
| 12 | Vincular padre: invitación por correo y activación con código | Implementado |
| 13 | DB: `posts`, `post_children` y `post_photos` (RLS) | Implementado |
| 14 | Publicar entradas del staff con o sin fotos | Implementado |

Qué hace cada spec:

- **01 — Feed home:** `/` con sidebar y bottom-nav responsive, paleta del mockup en `@theme`, fuentes Fredoka y Nunito, componentes reutilizables (`post-card`, `composer-card`, `section-divider`…), posts hardcodeados en `lib/data.ts`.
- **02 — Kids:** listado de 8 niños agrupados por sala, buscador por nombre (client-side), perfil con alergias/notas, datos del niño y padres vinculados (`lib/kids.ts`); navegación activa por ruta.
- **03 — Login/Cuenta:** login sin selector de rol (email precargado) y activación de cuenta con código de invitación, navegando al feed; sin backend, todo estático.
- **04 — Agregar niño:** modal con validación (nombre + fecha + sala obligatorios), 3 salas hardcodeadas, edad/avatar/slug derivados y alta en memoria (se pierde al recargar).
- **05 — Vincular padre:** modal con código de invitación de 5 caracteres (sin 0/O/1/I), validación de email y padre agregado con badge PENDIENTE en memoria.
- **06 — Crear publicación:** modal con chips de audiencia (niños + sala), 7 tipos y foto simulada; al publicar agrega el post al inicio del feed en memoria; `PostType` se amplía a 7 tipos.
- **07 — Tabla `daycares`:** primera migración; tabla con RLS y seed de "Guardería Sala Soles" (más 3 guarderías ficticias con `address`).
- **08 — Tabla `users`:** enums `user_role`/`user_status`, perfiles vinculados a `auth.users`, trigger `handle_new_user` y seed del staff (`juan@mail.cl`).
- **09 — Auth real:** login/logout con Supabase, protección de rutas en `proxy.ts` y perfil real en sidebar y saludo del home.
- **10 — Salas y niños:** tablas `rooms`/`children` con RLS de staff; `/kids` lista desde Supabase, alta persistente y perfil real `/kids/[id]`.
- **11 — Vínculos e invitaciones:** tablas `parent_children`/`invitations` con enums y RLS (staff de la guardería y lectura propia de padres); la UI de vinculación todavía no las usa.
- **12 — Vincular padre por correo:** el modal crea la invitación real (server action), envía el código con Resend y `/activar-cuenta` registra al padre con Supabase Auth y acepta la invitación (RPC `accept_invitation`), incluido el caso hermanos y el consentimiento de fotos.
- **13 — Tablas de publicaciones:** `posts`, `post_children` y `post_photos` con enum `post_type`, índices, helpers `security definer` y RLS de staff/padres (el feed del padre queda resuelto a nivel DB).
- **14 — Publicar entradas con fotos:** el feed `/` y el modal de publicación se conectan a Supabase; el staff publica con o sin fotos (bucket privado + signed URLs, hasta 5, consentimiento de fotos bloqueado en UI y DB), con selector de sala, audiencia dirigida o "toda la sala" y limpieza de datos de prueba.

## Skills

Las skills locales (`.agents/skills/`) se instalan con `npx skills` y se trackean en `skills-lock.json`. Para refrescarlas:

```bash
# Spec-driven (spec + spec-impl)
npx skills@latest add Klerith/fernando-skills

# Supabase (supabase + supabase-postgres-best-practices)
npx skills add supabase/agent-skills

# Entrevistas para afinar un plan o diseño antes del spec (grill-me)
npx skills add https://github.com/mattpocock/skills --skill grill-me
```

## Roadmap

- Edición/borrado de publicaciones, visor de foto a pantalla completa y detalle de publicación.
- `reactions` y `comments` funcionales (likes y comentarios siguen en 0).
- Rol Familia: UI dedicada del feed de padres (`familia-feed.dc.html`), con chips por hijo, tarjetas por niño y RLS para que el padre lea niños, salas y maestras (hoy `/familia` muestra el feed compartido).
- Hardening de `users`/signup (hallazgos Críticos preexistentes de la auditoría).
- Pantallas restantes: Avisos, Mi cuenta, resumen del día y foto (hoy enlazan a `#`).
- `daily_summaries` y `devices` (push).

Auth, niños, invitaciones y el feed ya persisten en Supabase; el mock del feed quedó reducido a fallbacks de login/sidebar (`app/lib/data.ts`).
