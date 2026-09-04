import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { esTokenValido } from "@/lib/tokens";
import { remeras, remeraNino, ninos, contactos, relacionContactoEnum } from "@/db/schema";

const RELACIONES = relacionContactoEnum.enumValues;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth();
  const tutorId = session?.user?.tutorId;
  if (!tutorId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { token } = await params;
  if (!esTokenValido(token)) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const error = validar(body);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  const { nombre, contactoNombre, contactoCelular, contactoRelacion, alergiasNotas } = body;

  const remera = await db.query.remeras.findFirst({ where: eq(remeras.token, token) });
  if (!remera) {
    return NextResponse.json({ error: "Esa remera no existe" }, { status: 404 });
  }

  const vinculoExistente = await db.query.remeraNino.findFirst({
    where: and(eq(remeraNino.remeraId, remera.id), eq(remeraNino.activo, true)),
  });
  if (vinculoExistente) {
    return NextResponse.json({ error: "Esta remera ya tiene datos cargados" }, { status: 409 });
  }

  // db.transaction() no está soportado por el driver neon-http de este
  // proyecto — se generan los IDs acá para poder escribir las 3 tablas en
  // un solo db.batch() atómico sin depender de un id devuelto por la DB.
  const ninoId = randomUUID();
  const remeraNinoId = randomUUID();
  const contactoId = randomUUID();

  await db.batch([
    db.insert(ninos).values({
      id: ninoId,
      tutorId,
      nombre: nombre.trim(),
      alergiasNotas: alergiasNotas?.trim() || null,
    }),
    db.insert(remeraNino).values({
      id: remeraNinoId,
      remeraId: remera.id,
      ninoId,
    }),
    db.insert(contactos).values({
      id: contactoId,
      ninoId,
      nombre: contactoNombre.trim(),
      celular: contactoCelular.trim(),
      relacion: contactoRelacion,
      esPrincipal: true,
    }),
  ]);

  return NextResponse.json({ ok: true, ninoId });
}

function validar(body: unknown): string | null {
  if (!body || typeof body !== "object") return "Faltan datos";
  const b = body as Record<string, unknown>;
  if (typeof b.nombre !== "string" || b.nombre.trim().length < 2) {
    return "Falta el nombre del chico";
  }
  if (typeof b.contactoNombre !== "string" || b.contactoNombre.trim().length < 2) {
    return "Falta a quién llamar";
  }
  if (typeof b.contactoCelular !== "string" || b.contactoCelular.trim().length < 8) {
    return "El celular de contacto parece incompleto";
  }
  if (
    typeof b.contactoRelacion !== "string" ||
    !RELACIONES.includes(b.contactoRelacion as (typeof RELACIONES)[number])
  ) {
    return "Relación de contacto inválida";
  }
  if (b.consentimiento !== true) {
    return "Falta el consentimiento";
  }
  return null;
}
