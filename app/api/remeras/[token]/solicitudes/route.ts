import { NextResponse } from "next/server";
import { esTokenValido } from "@/lib/tokens";
import { crearSolicitud } from "@/lib/solicitudes";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!esTokenValido(token)) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const error = validar(body);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  const { celular, quienDiceSer } = body as { celular: string; quienDiceSer: string };

  const solicitud = await crearSolicitud({
    token,
    celularSolicitante: celular,
    quienDiceSer: quienDiceSer ?? "",
    urlBase: new URL(request.url).origin,
  });

  if (!solicitud) {
    return NextResponse.json({ error: "No encontramos esa remera" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, solicitudId: solicitud.id });
}

function validar(body: unknown): string | null {
  if (!body || typeof body !== "object") return "Faltan datos";
  const b = body as Record<string, unknown>;
  if (typeof b.celular !== "string" || b.celular.trim().length < 8) {
    return "Dejanos un celular donde te puedan llamar.";
  }
  return null;
}
