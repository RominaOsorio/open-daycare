# OpenDayCare

App web de una guardería: el feed de publicaciones para las familias, la gestión de niños, los avisos de la sala y la cuenta del usuario.

Construido con [Next.js 16](https://nextjs.org) (App Router), React 19, TypeScript y Tailwind CSS v4.

## Stack

- **Next.js 16.3.4** (App Router) + React 19 + TypeScript.
- **Tailwind CSS v4** (CSS-first): la paleta vive en `app/globals.css` con `@theme`; no hay `tailwind.config.*`.
- **Fuentes:** Fredoka y Nunito cargadas con `next/font/google` en `app/layout.tsx`.
- Alias de rutas: `@/*` apunta a la raíz del repo (no hay `src/`).

## Getting Started

```bash
npm install
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

El desarrollo es spec-driven: cada funcionalidad se especifica en `specs/` y se implementa por partes. El estado actual:

- **Spec 01 — Home: feed de publicaciones** (`specs/01-feed-home.md`) — Implementado y verificado.

## Roadmap

- Autenticación y login.
- Rutas de Niños, Avisos, Mi cuenta, crear/detalle de publicación y foto.
- Persistencia (base de datos).

Actualmente los enlaces internos apuntan a `#` (enlaces muertos) a la espera de esas pantallas.
