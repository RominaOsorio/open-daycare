# SPEC 12 — Vincular padre: invitación por correo y activación con código

> **Estado:** Implementado
> **Depende de:** SPEC 05 (modal Vincular padre), SPEC 09 (auth y rutas), SPEC 11 (tablas `parent_children` e `invitations`)
> **Fecha:** 2026-09-14
> **Objetivo:** Conectar la vinculación real de un padre a un niño: crear la invitación desde el modal, enviarle el código por correo con Resend, y permitir que cree su cuenta en `/activar-cuenta` y acepte la invitación con el código.

## Por qué existe este spec

SPEC 05 dejó el modal con estado en memoria y SPEC 11 creó `invitations` y `parent_children` vacías. Este spec cierra el circuito completo: staff invita → correo real → el padre se registra y acepta la invitación → vínculo persistente → tarjeta de padres con datos reales.

## Scope

**In:**

- Modal "Vincular padre" conectado a un Server Action que inserta la invitación (RLS staff) y envía el correo con Resend; estados de envío, error y éxito; al éxito cierra y hace `router.refresh()`.
- Reenvío: si ya existe una invitación `pending` del mismo email y niño, se actualiza con código nuevo y `expires_at`; no se duplica.
- Correo HTML en español con código, nombre del niño, link `/activar-cuenta?code=…&email=…` y "Vence en 7 días"; remitente configurable con `RESEND_FROM` (default `OpenDayCare <onboarding@resend.dev>`).
- Tarjeta PADRES VINCULADOS con datos reales: activos (`parent_children` + `users`) y pendientes (`invitations` con `expires_at > now()`).
- Migración: helper `current_staff_daycare_id()`, política `users_select_staff_parents`, política `invitations_update_staff`, RPC `get_invitation_info(code)` y RPC `accept_invitation(code, photo_consent)`.
- `/activar-cuenta` real: valida el código, muestra niño/sala/email, formulario de contraseña + checkbox, `signUp` con metadata `full_name`, aceptación inmediata y estados de código inválido/vencido y cuenta existente.
- Activación directa: `signUp` devuelve sesión al instante (Confirm email desactivado en el dashboard) y el formulario acepta la invitación en la misma pasada; luego cierra sesión y redirige a `/login?activada=1`.
- Caso hermanos: con sesión iniciada y código válido, botón "Vincular a {niño}" que acepta con la sesión actual.
- `/login` muestra "Cuenta activada, iniciá sesión" con `?activada=1` y "No pudimos vincular la invitación…" con `?activada=error`.
- `npm install resend`, `RESEND_FROM` en `.env.example`.
- Dashboard (hecho): Confirm email desactivado en Supabase Auth (`mailer_autoconfirm = true`).

**Out of scope (para futuros specs):**

- Feed de familia (`familia-feed.dc.html`) y políticas RLS para que el padre lea niños/posts.
- Cancelar invitaciones, job de expiración o marcar `expired` en masa.
- Reenvío desde la tarjeta o desde el correo; solo desde el modal.
- SMTP custom en Supabase (se usa el built-in con su rate limit).
- Verificación de dominio en Resend (solo cambia `RESEND_FROM`).
- Edición/desvinculación de padres y notificaciones.

## Data model

`app/lib/kids.ts`: `ParentLink` gana `id` (id de `parent_children` o `invitations`); se elimina `buildParent()` (el server arma las filas).

```ts
interface ParentLink {
  id: string;
  name: string;
  relation: string;      // etiqueta UI: Mamá / Papá / Tutor/a
  status: "activo" | "pendiente";
  initial: string;
  avatarBg: string;
  avatarColor: string;
  email?: string;        // solo pendientes (viene de invitations)
}
```

`app/lib/invitations.ts` (nuevo): `RELATION_TO_DB` (`Mamá→mother`, `Papá→father`, `Tutor/a→guardian`), `RELATION_FROM_DB`, `PARENT_PALETTE` (color por índice), `mapAcceptedParent(row, index)` y `mapPendingParent(row, index)`.

Server Action (`app/actions/invitations.ts`, nuevo):

```ts
createInvitation(input: {
  childId: string; name: string; email: string; relation: Relation; code: string;
}): Promise<{ ok: true; resent: boolean } | { ok: false; error: string; regenerateCode?: boolean }>
```

Migración `agregar_funciones_politicas_invitaciones` (resumen; SQL completo al implementar):

```sql
-- Helpers security definer en el schema private: evitan la recursión de RLS
-- (users → parent_children → users) y no se exponen por PostgREST
create function private.current_staff_daycare_id() returns uuid
  stable security definer set search_path = ''
  as $$ select daycare_id from public.users
        where id = (select auth.uid()) and role = 'staff' $$;

create function private.parents_of_staff_daycare() returns setof uuid
  stable security definer set search_path = ''
  as $$ select pc.parent_id from public.parent_children pc
        join public.children c on c.id = pc.child_id
        join public.rooms r on r.id = c.room_id
        where r.daycare_id = private.current_staff_daycare_id() $$;

create policy "users_select_staff_parents" on public.users
  for select to authenticated
  using (id in (select private.parents_of_staff_daycare()));

create policy "invitations_update_staff" on public.invitations
  for update to authenticated
  using (/* staff + niño de su guardería, patrón de SPEC 11 */)
  with check (/* mismo check */);

create function public.get_invitation_info(p_code text)
  returns table (full_name text, email text, relationship public.relationship_type,
                 child_name text, room_name text, status public.invitation_status,
                 expires_at timestamptz)
  stable security definer set search_path = '' /* grants: anon y authenticated */;

create function public.accept_invitation(p_code text, p_photo_consent boolean)
  returns jsonb
  security definer set search_path = ''
  /* valida auth.uid(), email del JWT = email de la invitación (lower),
     status 'pending' y expires_at > now(); inserta parent_children (on conflict do nothing);
     marca accepted + accepted_at; si p_photo_consent = false actualiza children.photo_consent
     grant: authenticated */;
```

Convenciones:

- Código generado en el cliente (5 chars `A-HJ-NP-Z2-9`, como SPEC 05); el server valida formato y lo inserta tal cual. Colisión UNIQUE → `regenerateCode`.
- `accept_invitation` exige que el email del JWT coincida con `invitations.email` (case-insensitive): nadie acepta una invitación ajena.
- El email de la invitación es la identidad: en `/activar-cuenta` se muestra precargado y de solo lectura.
- `signUp` con `options.data = { full_name }`; el trigger `handle_new_user` de SPEC 08 crea el perfil (rol `parent` default, `daycare_id` null). El código y el consentimiento van directo a `accept_invitation` con la sesión recién creada.
- `expires_at` se renueva a `now() + interval '7 days'` al reenviar; sin job de expiración (las vencidas se filtran en la UI y el reenvío las actualiza).

## Implementation plan

1. Dashboard (hecho): Confirm email desactivado en Supabase Auth (`mailer_autoconfirm = true`); no se tocan plantilla ni Site URL.
2. `npm install resend`; agregar `RESEND_FROM` a `.env.example` y `.env`.
3. Aplicar la migración `agregar_funciones_politicas_invitaciones` con `supabase_apply_migration` y guardar el SQL en `supabase/migrations/<timestamp>_….sql`; verificar con `list_migrations`, `list_tables`, `pg_policies`, `pg_proc`, advisors y prueba funcional en `begin … rollback`.
4. `app/lib/invitations.ts`: mapas, paleta y mappers; en `app/lib/kids.ts` agregar `id` a `ParentLink` y eliminar `buildParent`.
5. `app/lib/resend.ts`: cliente con `RESEND_API_KEY` y `sendInvitationEmail({ to, parentName, childName, code, link })` con el HTML; `from` = `RESEND_FROM`.
6. `app/actions/invitations.ts`: `createInvitation` — valida sesión/rol (RLS), formato de código y email; detecta invitación `accepted` del mismo email+niño (error) o `pending` (UPDATE + reenvío) o INSERT; llama `refresh()` de `next/cache` tras la mutación (patrón de Next 16) para actualizar la tarjeta sin recargar; envía el correo; link con el `origin` del request.
7. `app/kids/[id]/page.tsx`: leer `parent_children` con `users` (activos) e `invitations` pendientes no vencidas; mapear y pasar a `ParentsCard`.
8. `app/components/kids/link-parent-modal.tsx`: reemplazar `onSend` local por el Server Action; estados `sending`/`error`; mantener código y validaciones de SPEC 05; `regenerateCode` genera otro código; al éxito cierra (el refresh del router lo hace la acción con `refresh()` de `next/cache`).
9. `app/components/kids/parents-card.tsx`: props con datos reales; sin estado local de padres.
10. `app/activar-cuenta/page.tsx` (server): lee `searchParams`; sin `code` muestra el paso para ingresarlo; con `code` llama `get_invitation_info` y renderiza el formulario validado o el error.
11. `app/components/auth/activate-form.tsx` (client): código/email read-only, contraseña, checkbox, `signUp` con metadata `full_name`; con la sesión devuelta llama RPC `accept_invitation(code, photo_consent)`, `signOut()` y redirige a `/login?activada=1`; caso cuenta existente; variante con sesión previa ("Vincular a {niño}"). Sin estado "Revisá tu correo".
12. `app/login/page.tsx` + `login-form.tsx`: leer `?activada=1|error` y mostrar el aviso.
13. Verificar end-to-end con Playwright y correo real al email dueño de Resend; `npm run lint` y `npm run build`.

## Acceptance criteria

- [x] `npm run build` termina sin errores y `npm run lint` no reporta errores nuevos.
- [x] `mailer_autoconfirm = true` (Confirm email desactivado) verificado con `/auth/v1/settings`.
- [x] `list_migrations` registra la migración; `pg_policies` muestra `users_select_staff_parents` e `invitations_update_staff`; existen `current_staff_daycare_id`, `get_invitation_info` y `accept_invitation` con los grants indicados.
- [x] Los advisors de seguridad no reportan problemas nuevos, salvo los WARN intencionales `0028`/`0029` de `get_invitation_info` y `accept_invitation` (endpoints públicos por diseño, documentados en Decisions).
- [x] Prueba RLS en `begin … rollback`: staff de Sala Soles ve el nombre de un padre vinculado a un niño de su guardería; un usuario sin vínculo no ve esa fila.
- [x] En `/kids/{id}`, invitar con el email dueño de la cuenta Resend inserta una fila `pending` (código de 5 chars, `expires_at` a 7 días), cierra el modal y la tarjeta muestra al padre con badge PENDIENTE sin recargar la página.
- [x] El correo llega con nombre del niño, código y link `/activar-cuenta?code=…&email=…`; `RESEND_FROM` controla el remitente.
- [x] Reenviar al mismo email+niño actualiza la misma fila (no crea otra) con código nuevo y manda otro correo.
- [x] Invitar un email ya `accepted` del mismo niño muestra error y no inserta nada.
- [x] `/activar-cuenta?code=VÁLIDO&email=…` muestra "Te invitaron a seguir a {niño} · {sala}", código y email precargados (email read-only).
- [x] Un código inexistente o vencido muestra el estado de error y no permite registrarse.
- [x] Completar el formulario crea el usuario con sesión, inserta el vínculo en `parent_children`, la invitación queda `accepted` con `accepted_at` y redirige a `/login?activada=1` con el aviso.
- [x] Con el checkbox destildado, `children.photo_consent` queda `false`; tildado, no cambia.
- [x] Con sesión iniciada y código válido del mismo email, `/activar-cuenta` muestra "Vincular a {niño}" y al usarlo se crea el vínculo y se cierra la sesión.
- [x] Con sesión iniciada de otro email, `/activar-cuenta` muestra "Estás conectado como {email}…" con botón "Cerrar sesión" y no ofrece el formulario hasta cerrar la sesión.
- [x] Con una invitación para un email que ya tiene cuenta y sin sesión iniciada, el formulario muestra "Ya existe una cuenta con este email…" (detecta `user_already_exists` de `signUp`) en lugar del error genérico.
- [x] `accept_invitation` falla si el email de la sesión no coincide con el de la invitación (probado con SQL).
- [x] No hay errores en la consola del navegador en las rutas tocadas.

## Decisions

- **Sí:** un solo spec end-to-end (decisión del usuario).
- **Sí:** Confirm email desactivado en el dashboard (decisión del usuario, `mailer_autoconfirm = true`): `signUp` devuelve sesión y la aceptación es inmediata, sin plantilla ni `/auth/confirm`. Los signups no verifican email; aceptado para este proyecto.
- **Sí:** Resend desde un Server Action; la API key nunca llega al cliente. `onboarding@resend.dev` en modo prueba con `RESEND_FROM` configurable.
- **Sí:** código generado en el cliente como SPEC 05; el server lo inserta tal cual y ante colisión devuelve `regenerateCode`.
- **Sí:** reenviar actualiza la invitación `pending` existente (nueva política UPDATE de staff) en vez de crear otra.
- **Sí:** tarjeta de padres con datos reales; política `users_select_staff_parents` con helpers `security definer` en el schema `private` (`current_staff_daycare_id`, `parents_of_staff_daycare`) porque una política de `users` que consulta `parent_children` entra en recursión (`users → parent_children → users`) y el schema privado no se expone por PostgREST.
- **Sí:** `get_invitation_info` (anon) y `accept_invitation` (authenticated) son endpoints públicos por diseño; los lints `0028`/`0029` los marcan como WARN intencional. `accept_invitation` valida `auth.uid()`, email del JWT, estado y expiración; `get_invitation_info` solo devuelve datos con un código secreto válido.
- **Sí:** aceptación vía RPC `security definer` que valida el email del JWT; el email de la invitación es la identidad y el campo queda read-only.
- **Sí:** `photo_consent` se actualiza solo si el checkbox está destildado.
- **Sí:** post-activación cierra sesión y va a `/login?activada=1` (el feed de familia no existe).
- **Sí:** caso hermanos con sesión iniciada y mismo email.
- **Sí:** el modo hermanos exige que el email de la sesión coincida con el de la invitación (case-insensitive); con otra sesión se muestra "Estás conectado como {email}…" con botón "Cerrar sesión" porque `accept_invitation` valida el email del JWT y el vínculo fallaría con `email_mismatch` (fix posterior a la verificación inicial).
- **Sí:** cuando falla el envío de Resend, el error del modal incluye el detalle de la API (`error.message`) para poder diagnosticar (p. ej. modo prueba de Resend solo envía al email dueño).
- **Sí:** la detección de cuenta existente usa el error `user_already_exists` de `signUp` (con Confirm email desactivado Supabase no devuelve `identities: []`, devuelve 422); el mensaje guía a iniciar sesión y reabrir el enlace para vincular con la sesión existente (caso hermanos).
- **Sí:** `refresh()` de `next/cache` dentro de `createInvitation` (patrón de mutación de Next 16) en lugar de `router.refresh()` en el cliente: el refresh del router ocurre también cuando el envío del correo falla, así la tarjeta refleja la invitación pendiente sin recargar.
- **No:** feed de familia, cancelar invitaciones, job de expiración, SMTP custom, reenvío desde la tarjeta, verificación de dominio.

## Risks

| Risk | Mitigation |
|---|---|
| El SMTP built-in de Supabase tiene rate limit (pocos correos por hora) | La verificación se hace en una sola pasada; SMTP custom queda para otro spec. |
| Resend en modo prueba solo envía al email dueño de la cuenta | La verificación usa ese email como padre invitado; con dominio verificado solo cambia `RESEND_FROM`. |
| RLS recursiva al leer `users` desde su propia política | Helpers `security definer` en `private` (`current_staff_daycare_id`, `parents_of_staff_daycare`) que cortan el ciclo; verificado con prueba funcional. |
| Signups sin verificación de email | Confirm email desactivado a propósito; el código de invitación sigue siendo obligatorio para vincular. |
| El correo cae en spam | Remitente de prueba documentado; dominio verificado en otro spec. |
| Código de 5 chars adivinable (33M combinaciones) | UNIQUE, expiración de 7 días, email del JWT debe coincidir y la invitación es de un solo uso. |
| El usuario cambia el email en el formulario | El campo es read-only y la RPC valida contra el email de la invitación. |

## What is **not** in this spec

- Feed de familia y políticas RLS para el rol padre.
- Cancelar invitaciones, job de expiración, marcar `expired` en masa.
- Reenvío desde la tarjeta o desde el correo.
- SMTP custom en Supabase y verificación de dominio en Resend.
- Edición/desvinculación de padres y notificaciones.

Cada uno de esos puntos, si llega, va en su propio spec.
