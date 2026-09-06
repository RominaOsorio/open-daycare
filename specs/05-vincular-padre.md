# SPEC 05 — Vincular padre

> **Estado:** Aprobado
> **Depende de:** SPEC 02, SPEC 04
> **Fecha:** 2026-09-06
> **Objetivo:** Implementar la vinculación de un padre/madre en un modal desde `/kids/[slug]` basado en `references/pantallas/vincular-padre.dc.html`, con nombre, email y parentesco, código de invitación generado y el padre agregado en memoria con estado pendiente.

## Scope

**In:**

- Modal sobre el perfil `/kids/[slug]` (fondo oscurecido) que se abre desde "Vincular otro padre" en `ParentsCard` (hoy `href="#"`), con la estructura del mockup: header "Vincular padre" + "a <Nombre>" + botón X; banner informativo azul ("Le enviaremos un correo con un código…"); campos NOMBRE DEL PADRE/MADRE, EMAIL y PARENTESCO (chips Mamá/Papá/Tutor/a); box CÓDIGO DE INVITACIÓN; botón "Enviar invitación".
- Código de invitación: 5 caracteres (mayúsculas y dígitos, sin ambiguos 0/O/1/I), generado al abrir el modal, con "Vence en 7 días" como texto estático.
- Validación: "Enviar invitación" deshabilitado hasta nombre (no vacío) y email válido (regex simple); "Mamá" preseleccionada; email ya vinculado en el perfil muestra error bajo EMAIL y bloquea el envío.
- Al enviar: el modal se cierra y el padre se agrega al final de la lista con `status: "pendiente"` ("invitación enviada") y badge PENDIENTE.
- Cierre: botón X, tecla Escape y clic en el fondo. Campos vacíos y código nuevo en cada apertura.
- Estado en memoria: el padre vinculado se pierde al recargar (el perfil vuelve a `KIDS`).

**Out of scope (para futuros specs):**

- Envío real de correo / backend de invitaciones.
- Activación de la cuenta del padre con el código (conecta con SPEC 03).
- Persistencia (localStorage o backend).
- Vinculación desde el listado `/kids` (badge VINCULAR) o desde la tarjeta del niño agregado en SPEC 04 (su perfil aún no existe).
- Edición o desvinculación de padres ya vinculados.
- Reenvío de invitación y expiración real del código.

## Data model

`app/lib/kids.ts` — adiciones:

```ts
export const RELATIONS = ["Mamá", "Papá", "Tutor/a"] as const;
export type Relation = (typeof RELATIONS)[number];

// ParentLink gana email opcional (solo lo tienen los vinculados en memoria)
export interface ParentLink {
  name: string;
  relation: string;
  status: ParentStatus;
  initial: string;
  avatarBg: string;
  avatarColor: string;
  email?: string;
}

export const PARENT_PALETTE: Array<{ bg: string; color: string }> = [
  { bg: "#C9B6E8", color: "#fff" },
  { bg: "#A9C7E8", color: "#fff" },
  { bg: "#F4B8CC", color: "#fff" },
  { bg: "#B9DEC4", color: "#fff" },
  { bg: "#F4DC8E", color: "#fff" },
  { bg: "#A9D9E8", color: "#fff" },
];

export function generateInviteCode(length = 5): string;
export function isValidEmail(value: string): boolean;
export function buildParent(
  input: { name: string; email: string; relation: Relation },
  existingParents: ParentLink[],
): ParentLink; // initial, avatar (PARENT_PALETTE[existing.length % …]), status "pendiente", email
```

## Implementation plan

1. `app/lib/kids.ts`: agregar `RELATIONS`, `Relation`, `email?` en `ParentLink`, `PARENT_PALETTE`, `generateInviteCode()`, `isValidEmail()` y `buildParent()`.
2. `app/components/icons.tsx`: agregar `InfoIcon` (círculo con "i"), `XIcon` (cierre) y `SendIcon` (avión de papel), según el mockup.
3. `app/components/kids/link-parent-modal.tsx` (client): modal con backdrop, header, banner, inputs, chips de parentesco, box de código y botón; validación y cierre (X/Escape/fondo); props `{ open, kidName, existingParents, onClose, onSend(parent) }`; reinicio de campos y código al abrir.
4. `app/components/kids/parents-card.tsx`: convertir a `"use client"`, estado `parents` (inicial `kid.parents`) y `modalOpen`; el link "Vincular otro padre" pasa a botón que abre el modal; al enviar agrega el padre al final y cierra.
5. Verificar con `npm run build` y Playwright (escritorio y móvil <1024px) contra `vincular-padre.dc.html` y el flujo completo.

## Acceptance criteria

- [x] `npm run build` termina sin errores.
- [x] En `/kids/mateo-fernandez`, tocar "Vincular otro padre" abre el modal sobre el perfil con fondo oscurecido; header "Vincular padre" + "a Mateo Fernández" + botón X, banner azul con el texto del mockup, campos NOMBRE DEL PADRE/MADRE (placeholder "Ej. Diego Fernández"), EMAIL ("correo@ejemplo.com"), PARENTESCO con Mamá seleccionada, box "CÓDIGO DE INVITACIÓN" con 5 caracteres y "Vence en 7 días", y botón "Enviar invitación" con ícono.
- [x] "Enviar invitación" está deshabilitado hasta completar nombre y email válido; se habilita con ambos.
- [x] Si el email ya está vinculado (en memoria), muestra un error bajo EMAIL y no permite enviar.
- [x] Al enviar, el modal se cierra y el padre aparece en PADRES VINCULADOS con inicial, nombre, "Mamá · invitación enviada" y badge PENDIENTE.
- [x] Recargar el perfil restaura los padres originales (sin persistencia).
- [x] X, Escape y clic en el fondo cierran el modal sin agregar nada; al reabrir, los campos están vacíos y el código es distinto al anterior.
- [x] El código de invitación tiene exactamente 5 caracteres alfanuméricos en mayúsculas y cambia en cada apertura.
- [x] En móvil (<1024px) el modal se ve completo dentro del ancho de pantalla.
- [x] No hay errores en la consola del navegador en las rutas tocadas.

## Decisions

- **Sí:** Modal sobre el perfil desde "Vincular otro padre". El mockup es una página, pero SPEC 04 estableció el patrón de modal y la acción es contextual.
- **Sí:** Estado en memoria en `ParentsCard` (client). Sin persistencia todavía; recarga restaura.
- **Sí:** Envío simulado sin backend: agrega el padre con `status: "pendiente"` y "invitación enviada". No hay correo real.
- **Sí:** Código generado client-side de 5 caracteres, regenerado en cada apertura y no guardado. "Vence en 7 días" es texto estático.
- **Sí:** X + Escape + clic en el fondo, consistente con SPEC 04.
- **Sí:** Botón deshabilitado hasta nombre + email válido; "Mamá" preseleccionada; bloqueo de email duplicado con mensaje bajo el campo.
- **No:** Backend de correo, activación con código (SPEC 03), persistencia, vinculación desde el listado, edición/desvinculación.

## Risks

| Risk | Mitigation |
|---|---|
| El perfil es SSG sobre `KIDS` | El estado vive en `ParentsCard` (client) desde la prop; la recarga pierde lo agregado (documentado). |
| El código no se guarda en `ParentLink` | Si luego se activa la cuenta (SPEC 03), la persistencia del código va en su propio spec. |
| Duplicados solo detectables entre emails en memoria | Los padres originales no tienen email; el check aplica a lo vinculado en la sesión. |

## What is **not** in this spec

- Backend de correo o de invitaciones.
- Activación de la cuenta del padre con el código.
- Persistencia (localStorage o backend).
- Vinculación desde el listado `/kids`.
- Edición o desvinculación de padres.
- Expiración real del código de invitación.

Cada uno de esos puntos, si llega, va en su propio spec.
