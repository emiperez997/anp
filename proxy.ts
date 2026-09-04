import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Protege todo bajo /panel/* (route group (tutor)). El route group en sí no
 * aparece en la URL, por eso el matcher usa la ruta real.
 *
 * Cualquier página nueva que se agregue dentro de app/(tutor)/ queda cubierta
 * automáticamente por este matcher, sin tener que acordarse de proteger cada
 * page.tsx individualmente.
 *
 * Cada page.tsx de (tutor) YA hace su propio auth()+redirect (ver
 * lib/ownership.ts) — este proxy es una segunda capa, no la única. No hace
 * falta declarar runtime nodejs: "proxy" (a diferencia del viejo
 * middleware.ts) siempre corre en Node.js, nunca en Edge.
 */
export async function proxy(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.tutorId) {
    const loginUrl = new URL("/cuenta", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*"],
};
