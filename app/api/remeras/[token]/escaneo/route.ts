import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { esTokenValido } from "@/lib/tokens";
import { parseUbicacion } from "@/lib/ubicacion";
import { excedeLimite } from "@/lib/rate-limit";
import { registrarEscaneoUbicacion } from "@/lib/accesos";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!esTokenValido(token)) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  if (excedeLimite(request, "escaneo")) {
    return NextResponse.json({ error: "Demasiados intentos" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const ubicacion = parseUbicacion(
    body && typeof body === "object" ? (body as Record<string, unknown>).ubicacion : null
  );
  if (!ubicacion) {
    return NextResponse.json({ error: "Ubicación inválida" }, { status: 400 });
  }

  const clienteId = (body as Record<string, unknown>).clienteId;
  if (typeof clienteId !== "string" || !/^[A-Za-z0-9-]{1,64}$/.test(clienteId)) {
    return NextResponse.json({ error: "Cliente inválido" }, { status: 400 });
  }

  const session = await auth();
  const registrado = await registrarEscaneoUbicacion(token, ubicacion, clienteId, session?.user?.tutorId);

  return NextResponse.json({ ok: true, registrado });
}
