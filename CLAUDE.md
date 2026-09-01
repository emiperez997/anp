# ANP — Identificación de chicos vía QR/NFC

## Qué es esto

App web (mobile-first) que resuelve la identificación de un chico perdido/encontrado
a partir de un código QR o chip NFC cosido a la remera. Al escanear:

- Si el código no tiene datos → invita a registrarse (solo el tutor puede cargar).
- Si ya tiene datos → muestra una **card pública mínima** (nombre, edad, alergias,
  botón de llamar al contacto principal).
- Cualquier otro dato sensible (dirección, escuela, segundo contacto) queda oculto
  detrás de un **pedido de acceso**: el tutor recibe un SMS, decide si autoriza
  (por 15 minutos) o no, y puede optar por llamar él mismo antes de autorizar nada.

La pieza central del producto no es el formulario, es el **mecanismo de permiso**:
mismo link para el tutor y para un desconocido, pero lo que cada uno ve depende de
si está logueado como dueño del registro o no.

## Stack (definido)

- **Next.js** (App Router) + **TypeScript** — frontend, backend (API routes/Server Actions) y panel del tutor en un solo repo.
- **Drizzle ORM** + **NeonDB** (Postgres serverless).
- **Auth.js**, login sin contraseña vía SMS OTP, con **Twilio Verify** como provider (crédito de prueba gratis, cubre todo el piloto).
- **SWR** o **TanStack Query** para el polling de estado en la pantalla de "esperando autorización" — no se usa WebSockets en el MVP, es overkill para este volumen.
- **Vercel Cron Jobs** para expirar automáticamente las solicitudes de acceso vencidas (corre cada minuto, free tier alcanza).
- **Vercel** para deploy, **GitHub** para el repo.
- Generación de QR con la librería `qrcode`.
- Chips NFC: NTAG213/215 en el piloto, programados con NFC Tools como registro NDEF tipo URI apuntando a `/r/{token}`. El token es un ID corto no adivinable, nunca un payload embebido (JWT, datos encriptados, etc. no entran en un chip de 144-504 bytes y no aportan seguridad real contra clonado — si más adelante hace falta anti-clonado real, ahí sí se evalúa NTAG 424 DNA con SUN/SDM).

## Modelo de datos (borrador — ajustar contra el schema real de Drizzle)

- `remeras` — id, `token` (el que va en el QR/NFC, único, no secuencial), talle, lote, estado (activa/perdida/dada de baja).
- `tutores` — id, celular (identidad de login), nombre.
- `ninos` — id, tutor_id (dueño/creador), nombre, fecha_nacimiento, alergias/notas médicas (texto libre opcional), grupo_sanguineo, obra_social.
- `remera_nino` — vincula remera ↔ niño (1 niño puede tener varias remeras activas).
- `contactos` — nino_id, nombre, celular, relación (mamá/papá/tutor), es_principal.
- `ediciones` — contador por `nino_id` o por `remera_nino`, tope 3, solo incrementable por el tutor_id creador (o admin, que puede resetear).
- `solicitudes_acceso` — quién pidió (celular declarado, texto libre de "quién dice ser"), qué remera, estado (pendiente/autorizado/rechazado/expirado), creado_en, expira_en (autorizado_en + 15 min), autorizado_por.
- `accesos_log` — histórico de escaneos y aprobaciones, para mostrarle al tutor "últimos accesos" en su panel.

No modelar la info sensible como parte del registro público — vive en tablas separadas que solo se joinean cuando hay una `solicitud_acceso` vigente y autorizada.

## Flujo de pantallas (referencia: `ANP - Pantallas QR.pdf`)

1. **Escaneo** — landing neutra, no distingue tutor de desconocido. Muestra el código de la remera (para dictarlo por teléfono) y dos CTAs: "Cargar los datos" / "¿Qué es ANP?".
2. **Cuenta** — login sin contraseña, SMS OTP al celular, aparece recién cuando hay intención real (no antes de tocar "cargar datos" o "pedir acceso").
3. **Registro** — un solo bloque: nombre del chico + a quién llamar (nombre, teléfono, relación) + campo opcional "algo que deban saber" (alergias/medicación). El consentimiento de datos de un menor va en su propio bloque, separado del resto de los términos.
4. **Card pública** — lo mínimo: nombre, edad, tags (alergia, grupo sanguíneo), botón de llamar como elemento dominante de la pantalla. Bloque aparte: "¿Necesitás más datos?" → dispara la solicitud de acceso.
5. **Solicitud de acceso** — el desconocido ve el estado (enviado/esperando/vence en N min). El tutor recibe el pedido con contexto (dónde se escaneó, quién dice ser, con qué teléfono) y tres opciones: llamar él primero, autorizar por 15 minutos, o no autorizar. El pedido caduca solo si no hace nada.
6. **Vista del tutor logueado** — misma card + botón editar (con contador de ediciones restantes) + opción de "ver la card como la ve un extraño" + log de últimos accesos.
7. **Panel multi-hijo** — lista de chicos y remeras activas del tutor, con aviso pasivo de datos incompletos.

## Convenciones de producto (no romper sin pensarlo)

- **Nunca** mostrar dirección, escuela o segundo contacto sin una `solicitud_acceso` autorizada y vigente.
- El login jamás es lo primero que ve alguien que solo encontró una remera — se pide cuando hace falta, no antes.
- Las ediciones son 3 por registro, solo por el tutor creador; un admin puede resetear pero eso queda logueado.
- Todo pedido de acceso es temporal (15 min) y expira solo — no requiere que nadie lo cierre a mano.
- Tono de copy: cálido y directo ("Está esperando esta llamada"), nunca clínico ni burocrático.

## Roadmap (ver `ANP-fase1-fase2.md` para el detalle paso a paso)

- **Fase 1 — MVP web**: setup, schema, login SMS, registro, card pública + edición, solicitud de acceso, expiración/polling, QR de prueba y deploy.
- **Fase 2 — Piloto NFC**: comprar y programar chips reales, testear lectura, cotizar producción textil, validar el flujo físico completo.
- **Fase 3 — Panel de administración**: reasignar/desbloquear ediciones, log de escaneos, gestión de lotes.
- **Fase 4 — Hardening legal**: registrar la base ante la AAIP, revisión legal de términos y consentimiento.
- **Fase 5 — App** (opcional): solo si se justifica por notificaciones push o gestión desde el celular; el core ya funciona 100% desde la web.

## Pendiente / próximos pasos

- Estados de error, alta de remera nueva, comportamiento offline (mencionados como "qué sigue" en las pantallas, sin definir todavía).
- Confirmar si el SMS de autorización sale por el mismo Twilio Verify que el login, o si conviene separar el provider de notificaciones del de OTP.
- Registrar la base ante la AAIP antes de producción con datos reales.
