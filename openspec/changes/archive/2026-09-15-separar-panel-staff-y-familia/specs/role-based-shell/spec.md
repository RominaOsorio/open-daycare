## Purpose

Separa la experiencia del panel del staff de la parte de la familia: cada rol ve su propia navegación, shell y rutas, y no puede acceder a las del otro rol.

## ADDED Requirements

### Requirement: Shell del panel del staff

El personal (`staff` y `admin`) DEBE (MUST) ver la navegación del panel — Feed (`/`), Niños (`/kids`), Avisos y Mi cuenta — con el nombre de su guardería como identidad del sidebar y su rol ("Staff"/"Admin") en el bloque de usuario.

#### Scenario: Staff en el feed

- **WHEN** un usuario `staff` con sesión visita `/`
- **THEN** ve la navegación del panel (Feed activo) y el nombre de su guardería en el sidebar

#### Scenario: Staff en la lista de niños

- **WHEN** un usuario `staff` visita `/kids`
- **THEN** ve la navegación del panel con "Niños" activo

### Requirement: Shell de la familia

Un usuario `parent` DEBE (MUST) ver la navegación de familia — Feed (`/familia`), Resumen del día y Mi cuenta — con la etiqueta "Familia" como identidad del sidebar y en el bloque de usuario.

#### Scenario: Padre en su feed

- **WHEN** un usuario `parent` con sesión visita `/familia`
- **THEN** ve la navegación de familia (Feed activo), la etiqueta "Familia" y ningún ítem del panel del staff

### Requirement: Acceso restringido por rol

El sistema DEBE (MUST) llevar a cada usuario a su propia área y NUNCA renderizar páginas del panel del staff a un `parent`, ni `/familia` a `staff`/`admin`.

#### Scenario: Padre intenta entrar al panel

- **WHEN** un `parent` visita `/`, `/kids` o `/kids/[id]`
- **THEN** es redirigido a `/familia`

#### Scenario: Staff intenta entrar al área de familia

- **WHEN** un usuario `staff` o `admin` visita `/familia`
- **THEN** es redirigido a `/`

#### Scenario: Admin tratado como staff

- **WHEN** un usuario `admin` visita `/`
- **THEN** ve el panel del staff y `/familia` lo redirige a `/`

#### Scenario: Sin sesión

- **WHEN** un visitante sin sesión entra a `/`, `/kids` o `/familia`
- **THEN** es redirigido a `/login`

#### Scenario: Sesión sin perfil

- **WHEN** un usuario con sesión válida pero sin fila en `public.users` entra al área de staff o de familia
- **THEN** el sistema responde 404 en vez de redirigir a `/login`, para no crear un loop con el redirect de login de un usuario autenticado

### Requirement: Rutas públicas

`/login` y `/activar-cuenta` DEBEN (MUST) seguir siendo accesibles sin sesión y sin shell de rol.

#### Scenario: Visitante en login

- **WHEN** un visitante sin sesión abre `/login`
- **THEN** ve el formulario de login sin sidebar ni navegación de rol

### Requirement: Feed de familia

En `/familia`, un `parent` DEBE (MUST) ver las publicaciones que la RLS le permite leer, sin composer ni acciones de publicación.

#### Scenario: Feed de un padre

- **WHEN** un `parent` con publicaciones visibles visita `/familia`
- **THEN** ve sus publicaciones y no ve "Compartí un momento…" ni "Nueva publicación"

### Requirement: Composer disponible en todo el panel

El botón "Nueva publicación" DEBE (MUST) abrir el modal de publicación en cualquier pantalla del panel del staff (`/`, `/kids`, `/kids/[id]`).

#### Scenario: Publicar desde Niños

- **WHEN** un usuario `staff` en `/kids` presiona "Nueva publicación"
- **THEN** se abre el modal de publicación con las salas y los niños de su guardería

### Requirement: Ítems de navegación pendientes

Los ítems cuya pantalla aún no existe (Avisos en el panel; Resumen del día y Mi cuenta en familia) DEBEN (MUST) aparecer en la navegación sin destino funcional, sin afectar al resto de la navegación.

#### Scenario: Ítem pendiente

- **WHEN** un usuario hace clic en "Avisos" (staff) o en "Resumen del día" (familia)
- **THEN** permanece en la misma pantalla sin error
