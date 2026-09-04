import { NextResponse } from "next/server";
import { getEstadoSolicitud } from "@/lib/solicitudes";

/**
 * Sin auth a propósito: quien pidió acceso no tiene cuenta. El `solicitudId`
 * es un UUID no adivinable y lo único que expone es el estado (pendiente/
 * autorizado/rechazado/expirado) — nada sensible.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ solicitudId: string }> }
) {
  const { solicitudId } = await params;
  const estado = await getEstadoSolicitud(solicitudId);
  if (!estado) {
    return NextResponse.json({ error: "No encontramos ese pedido" }, { status: 404 });
  }
  return NextResponse.json(estado);
}
