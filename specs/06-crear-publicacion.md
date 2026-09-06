# SPEC 06 — Crear publicación (modal)

> **Estado:** Aprobado
> **Depende de:** SPEC 01 (feed), SPEC 05 (patrón de modal)
> **Fecha:** 2026-09-06
> **Objetivo:** Implementar el modal de creación de publicación en `/` basado en `references/pantallas/crear-publicacion.dc.html`, abierto desde "Nueva publicación" (sidebar) y "Compartí un momento…" (composer), que al publicar agrega la publicación al inicio del feed en memoria.

## Scope

**In:**

- Modal sobre `/` (fondo oscurecido) con la estructura del mockup: header con "Cancelar" (izquierda, gris), "Nueva publicación" (centro) y "Publicar" (derecha, coral); sección PARA con chips de niños (Mateo, Sofía, Benjamín… de `KIDS`) + "Toda la sala"; sección TIPO con 7 chips (Comida, Siesta, Actividad, Logro, Ánimo, Foto, Anuncio) con sus colores; textarea DESCRIPCIÓN (placeholder "Contá cómo le fue hoy…"); sección FOTOS con miniatura placeholder y tile "Agregar".
- Disparadores: el botón "Nueva publicación" del sidebar (escritorio) y la tarjeta "Compartí un momento…" del composer (también en móvil). Hoy ambos son `href="#"`.
- Al tocar "Publicar": el modal se cierra y la publicación se agrega al inicio del feed con autor Caro Giménez, hora actual, tipo seleccionado, audiencia, texto y foto simulada (si se agregó); likes y comentarios en 0.
- Validación: "Publicar" deshabilitado hasta tener audiencia (≥1 seleccionado), tipo seleccionado y descripción no vacía.
- Cierre: "Cancelar", tecla Escape y clic en el fondo. Campos, chips y foto se resetean al cerrar.
- Estado en memoria: al recargar `/` vuelve el feed estático de `POSTS`.
- `PostType` se extiende a 7 tipos y el componente `Tag` los soporta (badges para Comida, Siesta, Ánimo y Foto).

**Out of scope (para futuros specs):**

- Upload real de fotos (solo miniatura simulada).
- Edición de publicaciones (el mockup del feed tiene "Editar"; no es esta pantalla).
- Likes y comentarios funcionales.
- Persistencia (localStorage o backend).
- Publicación desde otras vistas (`/kids`, avisos) o desde el perfil del niño.
- Detalle de publicación (SPEC 07 si llega).
- Múltiples fotos en una publicación.

## Data model

`app/lib/data.ts` — adiciones:

```ts
export type PostType =
  | "logro"
  | "actividad"
  | "anuncio"
  | "comida"
  | "siesta"
  | "animo"
  | "foto";

// Post se mantiene igual, solo cambia PostType.

export function nowTime(): string; // "HH:MM" local actual

export function audienceLabel(
  kids: Kid[],
  wholeRoom: boolean,
): string; // "toda la sala" | "familia de Mateo y Sofía" | "familia de Mateo, Sofía y Benjamín"
```

Convenciones:

- La lista del feed pasa a estado en memoria en un provider client: `posts` inicial `POSTS`, `addPost(post)` → `[post, ...posts]`.
- Nueva publicación: `{ id: String(Date.now()), author: USER, time: nowTime(), type, audience, text, photo?: { label: "Foto" }, likes: 0, comments: 0 }`.
- La audiencia se arma con los primeros nombres de los niños seleccionados: 1 → "familia de X"; 2 → "familia de X y Y"; 3+ → "familia de X, Y y Z". Con "Toda la sala" → "toda la sala".
- Chips TIPO con los colores exactos del mockup (hex inline, patrón de `link-parent-modal.tsx`). Chip de tipo seleccionado: borde `border-tinta` de 1.5px (el mockup no muestra estado de selección en TIPO).
- Badges `Tag` de los 4 tipos nuevos reutilizan tokens existentes (`etiqueta-amarilla`/`-texto`, `etiqueta-rosa`/`-texto`, `etiqueta-coral`/`-texto`) y se agregan dos tokens en `@theme`: `--color-violeta: #7b5fc0` y `--color-violeta-claro: #e7dcf6` (Siesta).

## Implementation plan

1. `app/lib/data.ts`: extender `PostType` a 7 valores; agregar `nowTime()` y `audienceLabel()`.
2. `app/globals.css`: agregar tokens `violeta` y `violeta-claro` en `@theme`.
3. `app/components/ui/tag.tsx`: mapear los 7 tipos (label, badge, dot, text) usando los tokens.
4. `app/components/feed/create-post-provider.tsx` ("use client"): contexto con `posts`, `open`, `openModal()`, `closeModal()`, `addPost()`; renderiza `CreatePostModal`.
5. `app/components/feed/create-post-modal.tsx` ("use client"): modal según mockup (header Cancelar/Nueva publicación/Publicar, chips PARA, chips TIPO, textarea, FOTOS) con validación y reset al cerrar.
6. `app/components/feed/post-list.tsx` ("use client"): renderiza la lista de posts desde el contexto.
7. `app/components/feed/composer-card.tsx`: pasar a "use client"; onClick abre el modal.
8. `app/components/layout/sidebar.tsx`: el botón "Nueva publicación" pasa de `<a href="#">` a botón que abre el modal.
9. `app/page.tsx`: envolver el contenido en `CreatePostProvider` y usar `PostList`.
10. Verificar con `npm run build` y Playwright (escritorio y móvil <1024px) contra `crear-publicacion.dc.html` y el flujo completo.

## Acceptance criteria

- [x] `npm run build` termina sin errores.
- [x] En `/`, tocar "Nueva publicación" (sidebar) abre el modal con fondo oscurecido; header "Cancelar", "Nueva publicación" y "Publicar"; chips PARA con Mateo, Sofía, Benjamín y "Toda la sala"; 7 chips de TIPO con los colores del mockup; textarea con placeholder "Contá cómo le fue hoy…"; sección FOTOS con miniatura y tile "Agregar".
- [x] En `/`, tocar "Compartí un momento…" (composer) abre el mismo modal.
- [x] "Publicar" está deshabilitado hasta seleccionar audiencia (≥1), tipo y descripción no vacía; se habilita con los tres.
- [x] Se pueden seleccionar varios niños; al elegir "Toda la sala" la audiencia resultante es "toda la sala".
- [x] Al publicar, el modal se cierra y la publicación aparece al inicio del feed con autor "Caro Giménez", hora actual, "publicado por vos", badge del tipo elegido, "Para: …", el texto y 0 likes y 0 comentarios.
- [x] Si se agregó una foto, la publicación muestra el placeholder "Foto" en el área de foto.
- [x] Recargar `/` restaura los 3 posts originales del mockup (sin persistencia).
- [x] "Cancelar", Escape y clic en el fondo cierran el modal sin agregar nada; al reabrir, los campos están vacíos y sin selecciones.
- [x] En móvil (<1024px) el modal se ve completo dentro del ancho de pantalla y el composer lo abre (el sidebar no está visible).
- [x] No hay errores en la consola del navegador en `/`.

## Decisions

- **Sí:** Modal en vez de página. El mockup es una página, pero SPEC 05 estableció el patrón de modal y la acción es contextual desde el feed.
- **Sí:** Estado en memoria con un provider client (posts + estado del modal). Recarga restaura; sin persistencia todavía.
- **Sí:** `PostType` extendido a 7 tipos y `Tag` completo. SPEC 01 definió solo 3; publicar los demás tipos exige el badge.
- **Sí:** Fotos simuladas: "Agregar" añade una miniatura placeholder (máx 1) y el post sale con `photo`. Upload real va en otro spec.
- **Sí:** Validación audiencia + tipo + descripción. Sin preselección de tipo; el chip seleccionado se marca con borde `border-tinta` porque el mockup no define ese estado.
- **Sí:** Chips con hex inline (patrón de `link-parent-modal`); badges con tokens del `@theme`.
- **No:** Upload de fotos, edición, persistencia, backend, likes/comentarios, múltiples fotos.

## Risks

| Risk | Mitigation |
|---|---|
| `POSTS` pasa de const server a estado client en el provider | La página sigue siendo SSG; el estado vive en el provider client. Recarga restaura. |
| Extender `PostType` rompe `Tag` si no se actualiza en el mismo cambio | `tag.tsx` se actualiza en el mismo commit. |
| Los niños de SPEC 04 agregados en memoria en `/kids` no aparecen en los chips PARA | Los chips salen de `KIDS` estático; los agregados en memoria viven en otro componente. Documentado. |
| Dos disparadores con un solo estado | El estado del modal vive en el provider; sidebar y composer consumen el mismo contexto. |

## What is **not** in this spec

- Upload real de fotos.
- Edición de publicaciones.
- Likes y comentarios funcionales.
- Persistencia (localStorage o backend).
- Publicación desde `/kids` o avisos.
- Detalle de publicación.
- Múltiples fotos por publicación.

Cada uno de esos puntos, si llega, va en su propio spec.
