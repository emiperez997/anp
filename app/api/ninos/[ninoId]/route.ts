import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { getNinoDeTutor, edicionesRestantesDeNino } from "@/lib/ownership";
import { ninos, contactos, remeraNino, relacionContactoEnum } from "@/db/schema";

const RELACIONES = relacionContactoEnum.enumValues;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ninoId: string }> }
) {
  const session = await auth();
  const tutorId = session?.user?.tutorId;
  if (!tutorId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { ninoId } = await params;
  const nino = await getNinoDeTutor(ninoId, tutorId);
  if (!nino) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const error = validar(body);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  const { nombre, contactoNombre, contactoCelular, contactoRelacion, alergiasNotas } = body;

  const edicionesRestantes = edicionesRestantesDeNino(nino.remeraVinculos);
  if (edicionesRestantes === null || edicionesRestantes <= 0) {
    return NextResponse.json(
      { error: "No quedan ediciones disponibles para este registro" },
      { status: 409 }
    );
  }

  await db
    .update(ninos)
    .set({ nombre: nombre.trim(), alergiasNotas: alergiasNotas?.trim() || null })
    .where(eq(ninos.id, ninoId));

  const contactoPrincipal = nino.contactos.find((c) => c.esPrincipal);
  if (contactoPrincipal) {
    await db
      .update(contactos)
      .set({
        nombre: contactoNombre.trim(),
        celular: contactoCelular.trim(),
        relacion: contactoRelacion,
      })
      .where(eq(contactos.id, contactoPrincipal.id));
  } else {
    await db.insert(contactos).values({
      ninoId,
      nombre: contactoNombre.trim(),
      celular: contactoCelular.trim(),
      relacion: contactoRelacion,
      esPrincipal: true,
    });
  }

  await db
    .update(remeraNino)
    .set({ edicionesRestantes: sql`${remeraNino.edicionesRestantes} - 1` })
    .where(sql`${remeraNino.ninoId} = ${ninoId} AND ${remeraNino.activo} = true`);

  return NextResponse.json({ ok: true, edicionesRestantes: edicionesRestantes - 1 });
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
