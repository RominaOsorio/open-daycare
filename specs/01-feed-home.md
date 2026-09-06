# SPEC 01 — Home: feed de publicaciones

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-09-05
> **Objetivo:** Implementar la página de inicio (`/`) con el feed de publicaciones idéntico al mockup `references/pantallas/feed.dc.html`, usando Tailwind, componentes reutilizables y diseño responsive.

## Scope

**In:**

- Página `/` con la estructura del mockup: sidebar (escritorio), contenido principal con header, compositor, divisor y 3 publicaciones.
- Paleta de colores del mockup definida en `@theme` (`app/globals.css`) y usada mediante clases Tailwind, sin hex inline.
- Fuentes Fredoka y Nunito cargadas con `next/font/google` en `app/layout.tsx`.
- Descomposición en componentes dentro de `app/components/`.
- Responsive: sidebar oculto en `<lg`, barra de navegación inferior fija en `<lg`.
- Datos de las publicaciones hardcodeados en `app/lib/data.ts` con tipado.
- Todos los enlaces internos apuntan a `#` (enlaces muertos).

**Out of scope (para futuros specs):**

- Autenticación y login.
- Base de datos o persistencia.
- Rutas funcionales para Niños, Avisos, Mi cuenta, crear publicación, detalle de publicación y foto.
- Otras pantallas del mockup (ninos.dc.html, avisos.dc.html, etc.).
- Edición real de publicaciones.

## Data model

```ts
// app/lib/data.ts
export type PostType = "logro" | "actividad" | "anuncio";

export interface Post {
  id: string;
  author: { name: string; avatarBg: string; avatarColor: string; initial: string };
  time: string;
  type: PostType;
  audience: string;
  text: string;
  photo?: { label: string };
  likes: number;
  comments: number;
}

export const POSTS: Post[] = [/* los 3 posts del mockup */];
```

Convenciones:

- Los posts se renderizan en el mismo orden del mockup (logro, actividad con foto, anuncio).
- Sin datos externos: todo es estático.

## Implementation plan

1. `app/layout.tsx`: reemplazar Geist por Fredoka y Nunito (`next/font/google`), `lang="es"`, metadata de OpenDayCare.
2. `app/globals.css`: definir paleta del mockup en `@theme` y ajustar estilos base (fondo crema, scrollbar).
3. `app/components/icons.tsx`: iconos SVG inline del mockup como componentes.
4. `app/lib/data.ts`: datos tipados de los 3 posts y del usuario (Caro Giménez, sala Soles).
5. `app/components/ui/avatar.tsx` y `app/components/ui/tag.tsx`: piezas reutilizables.
6. `app/components/layout/sidebar.tsx`: sidebar de escritorio (logo, botón Nueva publicación, nav con Feed activo, usuario).
7. `app/components/layout/bottom-nav.tsx`: barra inferior móvil con los 4 ítems.
8. `app/components/feed/post-card.tsx` y `app/components/feed/post-actions.tsx`: tarjeta de publicación con variantes por tipo.
9. `app/components/feed/composer-card.tsx` y `app/components/feed/section-divider.tsx`.
10. `app/page.tsx`: ensamblar sidebar, bottom-nav, header, compositor, divisor y lista de posts.
11. Verificar con `npm run build` y comparación visual con Playwright (escritorio y móvil).

## Acceptance criteria

- [x] `npm run build` termina sin errores.
- [x] `/` no muestra errores en la consola del navegador.
- [x] En escritorio (≥1024px) se ve el sidebar con logo, botón "Nueva publicación", nav (Feed activo, Niños, Avisos, Mi cuenta) y usuario "Caro Giménez".
- [x] En móvil (<1024px) el sidebar no se ve y aparece la barra inferior con los 4 ítems de navegación.
- [x] El header muestra "GUARDERÍA · SALA SOLES", "Buenas, Caro" y "12 niños · martes 17 jun".
- [x] Se muestran exactamente 3 publicaciones con los textos del mockup: logro (14:20, 3 likes, 1 comentario), actividad con foto (09:40, 5 likes, 2 comentarios), anuncio (07:50, 8 likes, 0 comentarios).
- [x] Cada badge de tipo usa los colores del mockup (logro verde, actividad celeste, anuncio azul).
- [x] Todos los enlaces internos apuntan a `#`.
- [x] Los colores coinciden con el mockup: fondo `#F6ECDF`, tarjetas `#FFFDF9`, bordes `#ECE0D0`.

## Decisions

- **Sí:** Tailwind v4 con paleta en `@theme` (CSS-first, sin `tailwind.config`). Es el sistema de estilos del proyecto.
- **Sí:** Componentes por pieza (sidebar, bottom-nav, post-card, etc.) para reutilizar en futuros specs.
- **Sí:** Responsive con barra inferior en móvil. Opción elegida por el usuario.
- **Sí:** Enlaces muertos (`#`) para las pantallas que aún no existen.
- **Sí:** Datos hardcodeados con tipado en `app/lib/data.ts`. No hay backend todavía.
- **No:** React Router / rutas adicionales. Solo `/`.
- **No:** Autenticación, base de datos o persistencia. Van en otro spec.

## What is **not** in this spec

- Autenticación y login.
- Base de datos o persistencia.
- Rutas o pantallas funcionales además de `/`.
- Responsive para el resto de las pantallas (no existen todavía).

Cada uno de esos puntos, si llega, va en su propio spec.
