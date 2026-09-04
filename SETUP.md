# ANP — Setup inicial (Fase 1, paso 2)

Orden recomendado. No hace falta tener Neon/Twilio creados para los primeros
dos pasos — recién hacen falta a partir del paso 4.

## 1. Crear el proyecto Next.js

```bash
npx create-next-app@latest anp --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"
cd anp
```

Respondé "No" a Turbopack si te lo pregunta (opcional, no debería dar
problemas, pero el piloto no lo necesita).

## 2. Pegar este scaffold encima

Copiá el contenido de este zip DENTRO de la carpeta `anp/` recién creada,
pisando lo que se solape (`app/`, etc. — `create-next-app` genera un
`app/page.tsx` y `app/layout.tsx` de ejemplo que vas a reemplazar).

## 3. Instalar dependencias

```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit

npm install next-auth@beta
npm install twilio

npm install @tanstack/react-query
npm install qrcode
npm install -D @types/qrcode

npm install nanoid
```

Notas:
- `next-auth@beta` porque Auth.js v5 (el que soporta App Router bien) todavía
  se publica bajo ese tag.
- `qrcode` es para generar el QR de prueba (paso final de Fase 1), no hace
  falta ya mismo pero no cuesta nada tenerlo instalado desde acá.

## 4. Crear el proyecto en Neon

1. https://console.neon.tech → crear proyecto → copiar el **pooled
   connection string**.
2. `cp .env.example .env` y completar `DATABASE_URL` con ese string.

## 5. Crear el servicio de Twilio Verify

1. https://console.twilio.com → crear cuenta de prueba (el crédito gratis
   alcanza para todo el piloto).
2. Verify → Services → crear uno nuevo → copiar el `Service SID` a
   `TWILIO_VERIFY_SERVICE_SID`.
3. Copiar `Account SID` y `Auth Token` del dashboard principal.
4. Para `TWILIO_SMS_FROM`: en una cuenta de prueba vas a necesitar comprar o
   usar el número de trial que te dan — este es el sender del SMS de
   notificación al tutor, **distinto** del Verify Service (que no manda SMS
   "normales", solo códigos).

## 6. Generar y correr la primera migración

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Revisá el SQL generado en `db/migrations/` antes de correrlo si querés estar
seguro de que los enums y foreign keys salieron como esperás.

## 7. Completar el resto de `.env`

- `AUTH_SECRET`: `openssl rand -base64 32`
- `CRON_SECRET`: `openssl rand -hex 16`
- `AUTH_URL`: `http://localhost:3000` en local

## 8. Correr en local

```bash
npm run dev
```

En este punto el repo compila pero las páginas están vacías (placeholders con
`return null` y rutas API que devuelven `501`) — son los próximos pasos del
roadmap:

| Placeholder | Corresponde a |
|---|---|
| `app/(public)/r/[token]/page.tsx` | Pantallas 1 y 4 |
| `app/(auth)/cuenta/page.tsx` | Pantalla 2 |
| `app/(tutor)/panel/[ninoId]/editar/page.tsx` | Pantalla 3 |
| `app/(tutor)/panel/page.tsx` | Pantalla 7 |
| `app/(tutor)/panel/[ninoId]/page.tsx` | Pantalla 6 |
| `app/api/solicitudes/*` | Pantalla 5 + mecanismo de acceso |
| `app/api/cron/expirar/route.ts` | Expiración automática |

## Lo que falta definir antes de este setup (repaso)

- Nada bloqueante — podés arrancar ya. Lo único pendiente real es decidir si
  `TWILIO_SMS_FROM` sale de la misma cuenta trial o si conviene un número
  aparte desde el día 1 (no cambia nada del código, solo qué valor va en esa
  variable).
