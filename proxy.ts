import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// import { auth } from "@/lib/auth"; // descomentar cuando esté configurado Auth.js

/**
 * Protege todo bajo /panel/* (route group (tutor)). El route group en sí no
 * aparece en la URL, por eso el matcher usa la ruta real.
 *
 * Cualquier página nueva que se agregue dentro de app/(tutor)/ queda cubierta
 * automáticamente por este matcher, sin tener que acordarse de proteger cada
 * page.tsx individualmente.
 */
export async function proxy(request: NextRequest) {
  // TODO: reemplazar por el chequeo real de sesión de Auth.js
  // const session = await auth();
  const session = null;

  if (!session) {
    const loginUrl = new URL("/cuenta", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*"],
};
