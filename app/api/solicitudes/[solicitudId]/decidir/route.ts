import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decidirSolicitud } from "@/lib/solicitudes";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ solicitudId: string }> }
) {
  const session = await auth();
  const tutorId = session?.user?.tutorId;
  if (!tutorId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { solicitudId } = await params;
  const body = await request.json().catch(() => null);
  const accion = (body as { accion?: string } | null)?.accion;
  if (accion !== "autorizar" && accion !== "rechazar") {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  const solicitud = await decidirSolicitud(solicitudId, tutorId, accion);
  if (!solicitud) {
    return NextResponse.json({ error: "No encontramos ese pedido" }, { status: 404 });
  }

  return NextResponse.json({ estado: solicitud.estado, expiraEn: solicitud.expiraEn });
}
