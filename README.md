# ANP — Identificación de chicos vía QR/NFC

App web mobile-first para identificar a un chico perdido o encontrado a partir de un
código QR o chip NFC en su remera. Quien escanea ve solo lo mínimo necesario (nombre,
edad, alergias, botón de llamar); cualquier dato sensible adicional (dirección,
escuela, segundo contacto) requiere que el tutor lo autorice en el momento, por una
ventana de 15 minutos.

## Cómo funciona

1. Alguien escanea el QR o acerca el celular al chip NFC de la remera.
2. Si el código no tiene datos cargados, se invita a registrarse (solo el tutor
   puede hacerlo, con login por SMS).
3. Si ya tiene datos, se muestra una card pública mínima con la info esencial.
4. Si quien escaneó necesita más datos, dispara una solicitud de acceso: el tutor
   recibe un SMS y decide si autoriza, por cuánto tiempo, o si prefiere llamar él
   primero.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Drizzle ORM** + **NeonDB** (Postgres serverless)
- **Auth.js** con login sin contraseña por SMS OTP (**Twilio Verify**)
- **SWR** / **TanStack Query** para polling de estado en tiempo real
- **Vercel Cron Jobs** para expirar solicitudes de acceso vencidas
- Librería `qrcode` para generar los códigos
- **Vercel** para hosting y deploy

## Empezar

```bash
git clone <repo>
cd anp
npm install
cp .env.example .env.local   # completar variables (ver abajo)
npm run db:migrate           # corre las migraciones de Drizzle contra Neon
npm run dev
```

### Variables de entorno necesarias

```
DATABASE_URL=            # connection string de NeonDB
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
AUTH_SECRET=              # para Auth.js
NEXT_PUBLIC_APP_URL=       # ej. https://anp.vercel.app, usado para armar los QR
```

## Estructura del proyecto

```
app/
  r/[token]/          → pantalla de escaneo, registro y card pública
  (tutor)/            → panel del tutor: sus remeras, editar, log de accesos
  api/                → rutas de servidor (solicitudes de acceso, cron, etc.)
db/
  schema.ts           → schema de Drizzle
  migrations/
lib/
  auth.ts             → configuración de Auth.js + Twilio
  sms.ts              → helpers para mandar SMS
```

## Roadmap

- **Fase 1 — MVP web**: registro, card pública, login por SMS, solicitud de acceso
  con expiración, QR de prueba. (ver `ANP-fase1-fase2.md`)
- **Fase 2 — Piloto NFC**: programar chips reales, testear lectura, cotizar
  producción textil.
- **Fase 3 — Panel de administración**: reasignar/desbloquear ediciones, gestión de
  lotes de chips.
- **Fase 4 — Hardening legal**: registro de la base ante la AAIP, revisión de
  términos y consentimiento.
- **Fase 5 — App** (opcional, más adelante): solo si se justifica por
  notificaciones push o gestión desde el celular.

## Notas de privacidad

- Los datos sensibles (dirección, escuela, segundo contacto) nunca se muestran sin
  una solicitud de acceso autorizada y vigente.
- El login nunca es lo primero que ve alguien que solo encontró una remera.
- Las ediciones de un registro están limitadas a 3, solo por el tutor que lo creó.

## Estado

En desarrollo — Fase 1 (MVP web).
