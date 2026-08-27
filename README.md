# ANP — Fase 1, entrega 2 (login SMS + primeras pantallas)

Esto se pega ENCIMA del `anp-scaffold.zip` de la entrega anterior (mismo
repo, mismas carpetas — algunos archivos se pisan a propósito:
`lib/auth.ts` estaba vacío/placeholder y acá queda implementado, igual que
las páginas de `(auth)/cuenta` y `(public)/r/[token]`).

## Qué trae

- **Diseño**: `app/globals.css` + `tailwind.config.ts` con los tokens del
  motivo "etiqueta de tela" (ver mockup que te pasé en el chat).
- **`lib/auth.ts`**: Auth.js v5 con un provider `Credentials` custom de dos
  pasos (SMS OTP vía Twilio Verify), no el flujo estándar de
  email/password.
- **`app/(auth)/cuenta/page.tsx`**: Pantalla 2 completa, con los dos pasos
  (celular → código) como client component.
- **`app/(public)/r/[token]/page.tsx`** + `components/public/CardRemera.tsx`:
  Pantallas 1 y 4 fusionadas — resuelve `getVistaRemera()` server-side y
  renderiza la rama que corresponda (neutra sin datos / pública / con acceso
  extendido / tutor).
- **`components/ui/`**: `Button`, `PhoneInput`, `OtpInput`, `Tag`,
  `StitchDivider` — los primitivos que van a reusar el resto de las
  pantallas.

## Dependencias nuevas a instalar

```bash
npm install clsx
```

(El resto — `next-auth@beta`, `twilio`, `drizzle-orm` — ya estaban en el
`SETUP.md` anterior.)

## Fuentes

Los tokens de tipografía (`--font-fraunces`, `--font-inter`,
`--font-jetbrains`) esperan que definas esas variables con `next/font` en
`app/layout.tsx`, algo como:

```ts
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

// y en el <body>: className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
```

No armé `app/layout.tsx` completo todavía porque falta ver qué metadata
querés (título, favicon, etc.) — decime si lo armamos ahora o después.

## Lo que falta para que esto compile y funcione de punta a punta

1. `app/layout.tsx` con las fuentes (arriba).
2. `app/(public)/r/[token]/pedir-acceso/` — la Pantalla 5 (todavía no
   existe, el link de "Pedir acceso" en `CardRemera` apunta ahí).
3. `app/(public)/que-es-anp/` — página estática simple, falta.
4. `app/(tutor)/panel/[ninoId]/editar/` real — hoy sigue siendo el
   placeholder `return null` de la entrega anterior; el botón "Editar" de
   `CardRemera` ya apunta a esa ruta.
5. Correr `npx drizzle-kit generate && npx drizzle-kit migrate` si todavía
   no lo hiciste (para que `tutores`, `ninos`, etc. existan en Neon antes de
   probar el login).

Te propongo que el próximo paso sea la Pantalla 5 (Solicitud de acceso) —
es la pieza que le da sentido a todo lo demás, y ya tenemos
`solicitudes_acceso` en el schema y las rutas API como placeholder
(`app/api/solicitudes/*`) esperando implementación.
