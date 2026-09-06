# SPEC 02 — Niños: listado y perfil

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-06
> **Objetivo:** Implementar `/kids` (listado de niños) y `/kids/[slug]` (perfil de niño) idénticos a los mockups `references/pantallas/ninos.dc.html` y `references/pantallas/perfil-nino.dc.html`, con datos hardcodeados y navegación activa por ruta.

## Scope

**In:**

- Página `/kids` con la estructura del mockup `ninos.dc.html`: header "GESTIÓN / Niños", botón "Agregar niño", buscador "Buscar niño…", sección "SALA SOLES · 8 niños" y grid de 8 tarjetas.
- Página `/kids/[slug]` con la estructura del mockup `perfil-nino.dc.html`: "Volver a Niños", header del niño (avatar, nombre, edad · sala, botón "Editar"), recuadro "Alergias y notas", tarjeta de datos (nacimiento, sala, ingreso), botón "Resumen del día" y tarjeta "PADRES VINCULADOS".
- Datos hardcodeados con tipado en `app/lib/kids.ts` (8 niños + padres vinculados).
- Buscador funcional: filtro client-side por nombre con `useState`.
- Grid responsive: 2 columnas en escritorio, 1 columna en móvil (<1024px), con bottom-nav visible.
- Navegación actualizada: Feed → `/`, Niños → `/kids`; estado activo por ruta en sidebar y bottom-nav.
- Consistencia de conteo: `ROOM.childrenCount` pasa de 12 a 8.
- Nuevos colores de la paleta en `@theme` (`app/globals.css`) y nuevos iconos en `app/components/icons.tsx`.

**Out of scope (para futuros specs):**

- `agregar-nino.dc.html` (alta/edición de niño): el botón "Agregar niño" y "Editar" quedan en `#`.
- `vincular-padre.dc.html` (invitación a padres): "Vincular otro padre" queda en `#`.
- `resumen-dia.dc.html`: el botón "Resumen del día" queda en `#`.
- Autenticación, backend, base de datos o persistencia.
- Fotos reales de los niños (los mockups usan iniciales en avatares).

## Data model

```ts
// app/lib/kids.ts
export type ParentStatus = "activo" | "pendiente";

export interface ParentLink {
  name: string;        // "Lucía Fernández"
  relation: string;    // "Mamá" | "Papá"
  status: ParentStatus;
  initial: string;     // "L"
  avatarBg: string;    // "#C9B6E8"
  avatarColor: string; // "#fff"
}

export interface Kid {
  slug: string;        // "mateo-fernandez"
  name: string;        // "Mateo Fernández"
  initial: string;     // "M"
  age: number;         // 3
  avatarBg: string;    // "#A9D9E8"
  avatarColor: string; // "#1F7A93"
  allergy?: string;    // etiqueta corta: "MANÍ" | "LACTOSA"
  birthDate: string;   // "12 mar 2022"
  room: string;        // "Soles"
  entryDate: string;   // "feb 2025"
  notes?: string;      // texto del recuadro "Alergias y notas"
  parents: ParentLink[];
}

export const KIDS: Kid[] = [/* los 8 niños del mockup */];
```

Convenciones:

- Los slugs derivan del nombre en kebab-case (mateo-fernandez, sofia-mendez, benjamin-ruiz, valentina-soto, tomas-diaz, emma-castro, lucas-romero, olivia-vega).
- El subtítulo de cada tarjeta se deriva: `"3 años · 2 padres vinculados"` (o "sin padres vinculados").
- La tarjeta muestra el badge de alergia si `kid.allergy` existe; si no, muestra una flecha. "VINCULAR" es un badge fijo cuando `parents.length === 0`.
- `app/lib/data.ts` solo cambia `ROOM.childrenCount` a 8. El feed no se toca.

## Implementation plan

1. `app/lib/kids.ts`: tipos `ParentStatus`, `ParentLink`, `Kid` y array `KIDS` con los 8 niños del mockup (nombres, edades, avatares, alergias, fechas, notas y padres con estado activo/pendiente).
2. `app/globals.css`: agregar al `@theme` los colores del mockup (alerta `#FBDAD6`, alerta-icono `#F4A8A0`, alerta-texto `#C5413A`, alerta-suave `#B25249`, etiqueta-coral `#FBD8CC`/`#D9684A`, etiqueta-rosa `#F9D2DE`/`#C56486`, etiqueta-amarilla `#F7E7A6`/`#9A7B1E`).
3. `app/components/icons.tsx`: agregar `ChevronLeftIcon`, `ChevronRightIcon` y `AlertIcon` (triángulo de advertencia del mockup).
4. `app/lib/data.ts`: cambiar `ROOM.childrenCount` de 12 a 8.
5. `app/components/layout/nav-items.tsx`: cambiar hrefs a `Feed → "/"` y `Niños → "/kids"`; Avisos y Mi cuenta siguen en `#`.
6. `app/components/layout/sidebar.tsx` y `bottom-nav.tsx`: estado activo según ruta con `usePathname()` (Feed activo en `/`, Niños en `/kids*`, el resto nunca activo).
7. `app/kids/page.tsx` + `app/components/kids/kid-card.tsx` + `app/components/kids/kids-grid.tsx` (client con filtro por nombre): ensamblar header, buscador, sección de sala y grid. Manual test: escribir "mate" filtra a Mateo.
8. `app/kids/[slug]/page.tsx` con `generateStaticParams` y `notFound()` + componentes del perfil en `app/components/kids/` (cabecera del niño, recuadro de alergias, tarjeta de datos, tarjeta de padres): ensamblar el perfil completo. Manual test: navegar desde una tarjeta y desde "Volver a Niños".
9. Verificar con `npm run build` y comparación visual con Playwright (escritorio y móvil) contra los mockups.

## Acceptance criteria

- [x] `npm run build` termina sin errores.
- [x] `/kids` muestra el header "Niños" con el botón "Agregar niño" y 8 tarjetas en grid de 2 columnas (escritorio).
- [x] Cada tarjeta muestra la inicial del avatar, el nombre, "X años · N padres vinculados" y el badge (MANÍ, LACTOSA, VINCULAR) o la flecha, como el mockup.
- [x] Escribir en "Buscar niño…" filtra la lista por nombre y borrar el texto restaura las 8 tarjetas.
- [x] Hacer clic en una tarjeta navega a `/kids/<slug>`.
- [x] `/kids/mateo-fernandez` muestra avatar M, "Mateo Fernández", "3 años · Sala Soles", botón "Editar", recuadro "Alergias y notas" con "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.", datos (12 mar 2022, Soles, feb 2025), botón "Resumen del día" y "PADRES VINCULADOS" con Lucía Fernández (ACTIVA) y Diego Fernández (PENDIENTE) más el enlace "Vincular otro padre".
- [x] "Volver a Niños" lleva a `/kids`; "Editar", "Resumen del día" y "Vincular otro padre" son enlaces muertos (`#`).
- [x] Un slug inexistente (por ejemplo `/kids/foo`) muestra la página 404 de Next.
- [x] En móvil (<1024px) el grid es de 1 columna, el sidebar está oculto y el bottom-nav se ve con "Niños" activo.
- [x] El nav marca "Niños" activo en `/kids` y `/kids/...`, y "Feed" activo en `/`.
- [x] El header del feed dice "8 niños · martes 17 jun" (`ROOM.childrenCount` = 8).
- [x] No hay errores en la consola del navegador en ninguna de las rutas.

## Decisions

- **Sí:** `/kids/[slug]` con slugs kebab-case. URLs legibles y estables para datos estáticos; migrar a ID numérico es trivial si llega backend.
- **Sí:** Datos en `app/lib/kids.ts` (nuevo archivo). `app/lib/data.ts` queda para el feed; solo se cambia el conteo.
- **Sí:** Conteo consistente en 8 niños en todo el sitio. El header del feed se actualiza para que no contradiga la lista.
- **Sí:** Buscador funcional con filtro client-side. Es un simple `useState` sin backend; el input del mockup deja de ser decorativo.
- **Sí:** Navegación activa por ruta con `usePathname()`. Sustituye el `active = index === 0` fijo de SPEC 01.
- **Sí:** Grid 1 columna en móvil. Los mockups son solo escritorio; esta es la adaptación coherente con el responsive ya establecido.
- **No:** Pantallas de agregar, vincular padre y resumen del día. Cada una merece su propio spec cuando se haga.
- **No:** Backend, persistencia o autenticación. Sigue siendo una app estática.

## Risks

| Risk                                                              | Mitigation                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Los mockups son solo de escritorio | El responsive móvil (1 columna) es una interpretación nuestra y se revisa en Playwright. |
| El filtro solo busca por nombre, no por sala | Es aceptable: hay una sola sala (Soles) en el mockup. |

## What is **not** in this spec

- Alta y edición de niños (`agregar-nino.dc.html`).
- Vinculación e invitación de padres (`vincular-padre.dc.html`).
- Resumen del día (`resumen-dia.dc.html`).
- Autenticación, backend y persistencia.
- Fotos reales de los niños.

Cada uno de esos puntos, si llega, va en su propio spec.
