# SPEC 04 — Agregar niño

> **Estado:** Aprobado
> **Depende de:** SPEC 02
> **Fecha:** 2026-09-06
> **Objetivo:** Implementar el alta de un niño desde `/kids` en un modal basado en `references/pantallas/agregar-nino.dc.html`, con nombre, fecha de nacimiento y sala obligatorios, alergias y notas médicas opcionales, 3 salas hardcodeadas y el niño agregado al listado en memoria.

## Scope

**In:**

- Modal sobre `/kids` (fondo oscurecido) que se abre al tocar "Agregar niño", con la estructura del mockup `agregar-nino.dc.html`: header "Cancelar / Agregar niño / Guardar" y campos NOMBRE COMPLETO, FECHA DE NACIMIENTO, SALA (selector), ALERGIAS (ETIQUETAS) y NOTAS MÉDICAS.
- Validación: "Guardar" deshabilitado hasta que nombre (no vacío), fecha (formato `dd/mm/aaaa` y fecha real) y sala estén completos; alergias y notas opcionales.
- Selector de sala con 3 opciones hardcodeadas: Soles (preseleccionada, como el mockup), Nubes y Estrellas.
- Al guardar: el niño se agrega al listado en memoria (estado React de `/kids`) y el modal se cierra; el listado se agrupa por sala en secciones ("SALA SOLES · N niños", etc.), solo para salas con niños.
- Cierre del modal: botón "Cancelar", tecla Escape o clic en el fondo.
- Derivaciones del niño nuevo: slug kebab-case, inicial del nombre, edad calculada desde la fecha de nacimiento, `birthDate` en formato "12 mar 2022", `entryDate` con mes/año actuales, avatar con colores de una paleta fija, `parents: []`.
- Tarjeta del niño agregado: igual que las demás pero sin navegación a perfil (aún no existe; se conecta cuando llegue la persistencia).

**Out of scope (para futuros specs):**

- Persistencia (localStorage o backend): el listado se reinicia al recargar.
- Edición de niños existentes ("Editar" del perfil sigue en `#`).
- Perfil dinámico para niños agregados (`/kids/[slug]` sigue estático).
- Validación más allá de los obligatorios (solo letras, edad mínima, fecha futura, etc.).
- Vinculación de padres del niño nuevo (queda "VINCULAR" como los existentes sin padres).
- Fotos reales de los niños.

## Data model

```ts
// app/lib/kids.ts — adiciones
export const ROOMS = ["Soles", "Nubes", "Estrellas"] as const;
export type Room = (typeof ROOMS)[number];

export interface NewKidInput {
  name: string;        // "Martina López"
  birthDate: string;   // "dd/mm/aaaa"
  room: Room;          // "Soles" | "Nubes" | "Estrellas"
  allergies?: string;  // "Maní, Lactosa"
  notes?: string;      // "Indicaciones, medicación, contactos…"
}
```

Convenciones (implementadas por `buildKid(input, existingSlugs)`):

- `slug`: kebab-case sin acentos; si ya existe, se agrega sufijo `-2`, `-3`, …
- `initial`: primera letra del primer nombre, en mayúscula.
- `age`: años cumplidos a la fecha actual desde la fecha de nacimiento.
- `birthDate`: formato "12 mar 2022" (día + mes corto es + año).
- `entryDate`: "sep 2026" (mes/año actuales).
- `avatarBg`/`avatarColor`: siguiente par de `AVATAR_PALETTE` (ciclo fijo de pares ya usados por los niños existentes).
- `allergy`: texto en mayúsculas si se cargó (ej. "MANÍ, LACTOSA"); sin valor si está vacío.
- `notes`: texto tal cual.
- `parents`: `[]`.

`Kid.room` ya es `string`; `ROOMS` define el orden de las secciones del grid. No se toca `app/lib/data.ts` (feed) ni `ROOM.childrenCount`.

## Implementation plan

1. `app/lib/kids.ts`: agregar `ROOMS`, tipo `Room`, `AVATAR_PALETTE` y `buildKid(input, existingSlugs)` (slug único, inicial, edad, fechas, avatar, alergia, notas).
2. `app/components/icons.tsx`: agregar `ChevronDownIcon` (chevron del selector SALA del mockup).
3. `app/components/kids/add-kid-modal.tsx` (client): modal con backdrop, header "Cancelar / Agregar niño / Guardar", campos del mockup, estado de inputs y validación (Guardar deshabilitado hasta completar obligatorios); cierra con Cancelar, Escape o clic en el fondo; prop `onSave(kid: Kid)`; campos se reinician al cerrar.
4. `app/components/kids/kids-manager.tsx` (client): estado `kids` (inicializado con `KIDS`) y `modalOpen`; renderiza header "GESTIÓN / Niños" con botón "Agregar niño", `KidsGrid` y el modal.
5. `app/kids/page.tsx`: usar `KidsManager` en lugar del header y grid actuales (sidebar y bottom-nav se mantienen).
6. `app/components/kids/kids-grid.tsx`: agrupar por sala en secciones según `ROOMS` (solo salas con niños), manteniendo buscador, conteos por sección y estado vacío.
7. `app/components/kids/kid-card.tsx`: soportar tarjetas sin enlace (niños agregados en memoria).
8. Verificar con `npm run build` y comparación visual con Playwright (escritorio y móvil) contra `agregar-nino.dc.html` y el flujo completo.

## Acceptance criteria

- [x] `npm run build` termina sin errores.
- [x] En `/kids`, tocar "Agregar niño" abre el modal sobre el listado con fondo oscurecido; muestra header "Cancelar / Agregar niño / Guardar" y los campos del mockup (NOMBRE COMPLETO con placeholder "Ej. Martina López", FECHA DE NACIMIENTO "dd/mm/aaaa", SALA con "Soles" y chevron, ALERGIAS (ETIQUETAS), NOTAS MÉDICAS).
- [x] "Guardar" está deshabilitado hasta completar nombre y fecha válida (`dd/mm/aaaa` real); se habilita con los obligatorios completos.
- [x] El selector SALA ofrece exactamente Soles, Nubes y Estrellas, con Soles preseleccionada.
- [x] Al guardar, el modal se cierra y el niño aparece en el grid en la sección de su sala (ej. "SALA NUBES · 1 niño"), con inicial, nombre, "X años · sin padres vinculados" y badge VINCULAR.
- [x] La tarjeta del niño agregado no navega a ningún perfil; las tarjetas existentes siguen navegando a `/kids/<slug>`.
- [x] "Cancelar", Escape y clic en el fondo cierran el modal sin agregar nada.
- [x] El buscador sigue filtrando entre todos los niños (incluido el agregado) y al borrar restaura la lista.
- [x] Las secciones del grid se ordenan Soles → Nubes → Estrellas y solo aparecen salas con niños.
- [x] Guardar sin alergias ni notas funciona; con alergia, la tarjeta muestra el badge con el texto en mayúsculas.
- [x] En móvil (<1024px) el modal se ve completo (tarjeta dentro del ancho de pantalla).
- [x] Recargar `/kids` restaura los 8 niños del mockup (sin persistencia).
- [x] No hay errores en la consola del navegador en ninguna de las rutas.

## Decisions

- **Sí:** Modal sobre `/kids`. La tarjeta del mockup tiene apariencia de modal y el alta queda contextualizada en el listado.
- **Sí:** Estado en memoria (React) en `/kids`. Sin backend ni persistencia todavía; se pierde al recargar.
- **Sí:** "Guardar" deshabilitado hasta validar obligatorios. Evita estados de error que el resto de la app no tiene todavía.
- **Sí:** 3 salas hardcodeadas: Soles (la existente), Nubes y Estrellas.
- **Sí:** Grid agrupado por sala. Con 3 salas posibles, la sección "SALA SOLES" fija dejaría de ser correcta.
- **Sí:** Tarjeta del niño agregado sin enlace a perfil. `/kids/[slug]` es estático y el perfil del recién agregado no existe; se conectará cuando llegue la persistencia.
- **Sí:** Fecha como texto `dd/mm/aaaa` con validación. Fiel al placeholder del mockup y simple.
- **Sí:** Escape y clic en el fondo cierran el modal. Comportamiento estándar; el mockup solo define "Cancelar".
- **No:** Persistencia, backend, edición de niños y perfil dinámico. Van en su propio spec cuando lleguen.

## Risks

| Risk                                                              | Mitigation                                                                  |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| El mockup es solo de escritorio                                    | El modal en móvil se revisa con Playwright; la tarjeta es `w-full max-w-[520px]` dentro del padding. |
| Niño agregado sin perfil (tarjeta sin enlace)                      | Se documenta: se conecta cuando exista persistencia; mientras tanto la tarjeta no navega. |
| Duplicado de slug si se agrega un nombre repetido                  | `buildKid` asegura unicidad con sufijo "-2", "-3", …                        |

## What is **not** in this spec

- Persistencia (localStorage o backend).
- Edición de niños existentes.
- Perfil dinámico para niños agregados.
- Validaciones adicionales (solo letras, fecha futura, etc.).
- Vinculación de padres del niño nuevo.
- Fotos reales de los niños.

Cada uno de esos puntos, si llega, va en su propio spec.
