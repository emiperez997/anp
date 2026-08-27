import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { tutores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verificarOtp } from "@/lib/twilio";

/**
 * El login es en dos pasos y NO usa el flujo "email magic link" ni
 * "credentials con password" de Auth.js: es SMS OTP vía Twilio Verify.
 *
 * Paso 1 (fuera de Auth.js): el form de /cuenta llama a un server action /
 * route que dispara lib/twilio.ts -> enviarOtp(celular). Auth.js no participa
 * todavía acá.
 *
 * Paso 2 (esto): cuando el usuario tipea el código de 6 dígitos, se llama a
 * signIn("credentials", { celular, codigo }) desde el cliente. El
 * `authorize` de abajo verifica el código contra Twilio y, si es válido,
 * busca o crea el tutor por celular. Auth.js arma la sesión a partir de lo
 * que devuelve `authorize`.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
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
    async jwt({ token, user }) {
      if (user) token.tutorId = user.id;
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
