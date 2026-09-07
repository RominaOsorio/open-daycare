# OpenDayCare

App web de una guardería: el feed de publicaciones para las familias, la gestión de niños, los avisos de la sala y la cuenta del usuario.

Construido con [Next.js 16](https://nextjs.org) (App Router), React 19, TypeScript y Tailwind CSS v4, con [Supabase](https://supabase.com) como backend (auth y Postgres).

## Stack

- **Next.js 16.3.4** (App Router) + React 19 + TypeScript.
- **Tailwind CSS v4** (CSS-first): la paleta vive en `app/globals.css` con `@theme`; no hay `tailwind.config.*`.
- **Fuentes:** Fredoka y Nunito cargadas con `next/font/google` en `app/layout.tsx`.
- **Supabase:** backend de auth y base de datos (Postgres + RLS). Referencia del schema en `07-DB-Schema/` (solo documentación, no está migrado aún).
- Alias de rutas: `@/*` apunta a la raíz del repo (no hay `src/`).

## Getting Started

```bash
npm install
cp .env.example .env   # completá SUPABASE_DB_PASSWORD
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
  page.tsx            # Home: feed de publicaciones
  lib/data.ts         # Datos tipados (posts, sala, usuario)
  components/
    icons.tsx         # Iconos SVG inline
    ui/               # Piezas reutilizables (Avatar, Tag)
    layout/           # Sidebar, barra inferior de navegación
    feed/             # Composer, divisor, tarjeta de post, acciones
references/
  pantallas/*.dc.html # Mockups HTML (fuente de verdad del diseño)
  screenshots/        # Capturas de referencia
specs/                # Especificaciones por funcionalidad
```

## Diseño

La fuente de verdad del diseño son los mockups de `references/pantallas/*.dc.html` y las capturas de `references/screenshots/`. Las pantallas se construyen para coincidir con ellos (paleta, tipografía, layout y responsive).

## Especificaciones

El desarrollo es spec-driven: cada funcionalidad se especifica en `specs/` (descripción, alcance, modelo de datos y plan de implementación) y se implementa por partes. Estado actual:

| Spec | Funcionalidad | Estado |
| ---- | ------------- | ------ |
| 01 | Home: feed de publicaciones (`/`) | Implementado |
| 02 | Niños: listado y perfil (`/kids`, `/kids/[slug]`) | Implementado |
| 03 | Login y activación de cuenta (`/login`, `/activar-cuenta`) | Implementado |
| 04 | Agregar niño (modal desde `/kids`) | Implementado |
| 05 | Vincular padre (modal desde `/kids/[slug]`) | Implementado |
| 06 | Crear publicación (modal en `/`) | Implementado |

Qué hace cada spec:

- **01 — Feed home:** `/` con sidebar y bottom-nav responsive, paleta del mockup en `@theme`, fuentes Fredoka y Nunito, componentes reutilizables (`post-card`, `composer-card`, `section-divider`…), posts hardcodeados en `lib/data.ts`.
- **02 — Kids:** listado de 8 niños agrupados por sala, buscador por nombre (client-side), perfil con alergias/notas, datos del niño y padres vinculados (`lib/kids.ts`); navegación activa por ruta.
- **03 — Login/Cuenta:** login sin selector de rol (email precargado) y activación de cuenta con código de invitación, navegando al feed; sin backend, todo estático.
- **04 — Agregar niño:** modal con validación (nombre + fecha + sala obligatorios), 3 salas hardcodeadas, edad/avatar/slug derivados y alta en memoria (se pierde al recargar).
- **05 — Vincular padre:** modal con código de invitación de 5 caracteres (sin 0/O/1/I), validación de email y padre agregado con badge PENDIENTE en memoria.
- **06 — Crear publicación:** modal con chips de audiencia (niños + sala), 7 tipos y foto simulada; al publicar agrega el post al inicio del feed en memoria; `PostType` se amplía a 7 tipos.

## Skills

Las skills locales (`.agents/skills/`) se instalan con `npx skills` y se trackean en `skills-lock.json`. Para refrescarlas:

```bash
# Spec-driven (spec + spec-impl)
npx skills@latest add Klerith/fernando-skills

# Supabase (supabase + supabase-postgres-best-practices)
npx skills add supabase/agent-skills
```

## Roadmap

- Autenticación y login (Supabase Auth).
- Rutas de Niños, Avisos, Mi cuenta, crear/detalle de publicación y foto.
- Persistencia con Supabase (Postgres + RLS) según el schema de referencia.

Actualmente los enlaces internos apuntan a `#` (enlaces muertos) a la espera de esas pantallas, y los datos son locales (`app/lib/data.ts`).
