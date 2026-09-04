import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { tutores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verificarOtp } from "@/lib/twilio";

/**
 * Dos formas de login, que coexisten y arman el mismo tipo de sesión
 * (`session.user.tutorId`) sin que el resto de la app necesite saber cuál
 * se usó:
 *
 * 1. SMS OTP vía Twilio Verify (provider "sms-otp"), en dos pasos:
 *    Paso 1 (fuera de Auth.js): el form de /cuenta llama a un server action /
 *    route que dispara lib/twilio.ts -> enviarOtp(celular). Auth.js no
 *    participa todavía acá.
 *    Paso 2 (el `authorize` de abajo): cuando el usuario tipea el código de
 *    6 dígitos, se llama a signIn("sms-otp", { celular, codigo }) desde el
 *    cliente. `authorize` verifica el código contra Twilio y busca o crea
 *    el tutor por celular.
 *
 * 2. Google OAuth (provider "google"): flujo estándar de Auth.js. El tutor
 *    se busca/crea por email en el callback `jwt` (ver abajo), no en
 *    `authorize` (Google no pasa por ese provider).
 *
 * Un tutor que entra alguna vez por SMS y otra por Google con la misma
 * persona real genera dos filas separadas en `tutores` (no hay account
 * linking celular↔email) — limitación conocida, aceptable para el MVP.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Google,
    Credentials({
      id: "sms-otp",
      name: "SMS OTP",
      credentials: {
        celular: { label: "Celular", type: "text" },
        codigo: { label: "Código", type: "text" },
      },
      async authorize(credentials) {
        const celular = credentials?.celular as string | undefined;
        const codigo = credentials?.codigo as string | undefined;
        if (!celular || !codigo) return null;

        const valido = await verificarOtp(celular, codigo);
        if (!valido) return null;

        let tutor = await db.query.tutores.findFirst({
          where: eq(tutores.celular, celular),
        });

        if (!tutor) {
          const [nuevo] = await db
            .insert(tutores)
            .values({ celular })
            .returning();
          tutor = nuevo;
        }

        // Lo que se devuelve acá queda disponible en el JWT/sesión.
        return { id: tutor.id, name: tutor.nombre ?? undefined };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account?.provider === "sms-otp") {
        // authorize() ya devolvió el id real de `tutores`.
        token.tutorId = user.id;
      }

      if (user && account?.provider === "google" && user.email) {
        let tutor = await db.query.tutores.findFirst({
          where: eq(tutores.email, user.email),
        });
        if (!tutor) {
          const [nuevo] = await db
            .insert(tutores)
            .values({ email: user.email, nombre: user.name ?? undefined })
            .returning();
          tutor = nuevo;
        }
        token.tutorId = tutor.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error -- augmentar el tipo de Session en next-auth.d.ts
        session.user.tutorId = token.tutorId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/cuenta",
  },
});
