/**
 * lib/solicitudes.ts
 * ---------------------------------------------------------------------------
 * Lógica del mecanismo de permiso: crear una solicitud de acceso, consultar
 * su estado (para el polling del desconocido) y decidirla (para el tutor).
 * El cron de expiración (app/api/cron/expirar) también vive de estas mismas
 * reglas de TTL.
 * ---------------------------------------------------------------------------
 */

import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { remeras, remeraNino, solicitudesAcceso, accesosLog } from "@/db/schema";
import { notificarSolicitudAcceso } from "@/lib/twilio";
import { SOLICITUD_TTL_MINUTOS } from "@/lib/constants";

export { SOLICITUD_TTL_MINUTOS };

export async function crearSolicitud(params: {
  token: string;
  celularSolicitante: string;
  quienDiceSer: string;
  urlBase: string;
}) {
  const { token, celularSolicitante, quienDiceSer, urlBase } = params;

  const remera = await db.query.remeras.findFirst({ where: eq(remeras.token, token) });
  if (!remera || remera.estado === "dada_de_baja") return null;

  const vinculo = await db.query.remeraNino.findFirst({
    where: and(eq(remeraNino.remeraId, remera.id), eq(remeraNino.activo, true)),
    with: { nino: { with: { tutor: true } } },
  });
  if (!vinculo) return null;

  const { nino } = vinculo;

  const [solicitud] = await db
    .insert(solicitudesAcceso)
    .values({
      remeraId: remera.id,
      celularSolicitante: celularSolicitante.trim(),
      quienDiceSer: quienDiceSer.trim() || null,
    })
    .returning();

  await db.insert(accesosLog).values({
    remeraId: remera.id,
    solicitudId: solicitud.id,
    tipo: "solicitud_creada",
  });

  // Un tutor que entró solo por Google puede no tener celular cargado
  // todavía — en ese caso no hay a dónde mandar el SMS. El pedido igual
  // queda creado y visible si el tutor entra al panel.
  //
  // El envío del SMS no puede tirar abajo la creación de la solicitud: ya
  // está guardada y el tutor la va a ver igual en su panel (aviso de
  // "pedido pendiente") aunque Twilio falle o no esté configurado.
  if (nino.tutor.celular) {
    try {
      await notificarSolicitudAcceso({
        celularTutor: nino.tutor.celular,
        ninoNombre: nino.nombre,
        quienDiceSer: solicitud.quienDiceSer,
        urlDecision: `${urlBase}/panel/solicitudes/${solicitud.id}`,
      });
    } catch (err) {
      console.error("No se pudo notificar la solicitud de acceso por SMS", err);
    }
  }

  return solicitud;
}

export async function getEstadoSolicitud(solicitudId: string) {
  const solicitud = await db.query.solicitudesAcceso.findFirst({
    where: eq(solicitudesAcceso.id, solicitudId),
    with: { remera: true },
  });
  if (!solicitud) return null;

  return {
    estado: solicitud.estado,
    creadoEn: solicitud.creadoEn,
    expiraEn: solicitud.expiraEn,
    remeraToken: solicitud.remera.token,
  };
}

/**
 * Devuelve la solicitud SOLO si `tutorId` es dueño del niño vinculado a la
 * remera de esa solicitud — mismo patrón que getNinoDeTutor: no distingue
 * "no existe" de "no es tuya", ambos casos resuelven en null.
 */
export async function getSolicitudParaDecidir(solicitudId: string, tutorId: string) {
  const solicitud = await db.query.solicitudesAcceso.findFirst({
    where: eq(solicitudesAcceso.id, solicitudId),
  });
  if (!solicitud) return null;

  const vinculo = await db.query.remeraNino.findFirst({
    where: and(eq(remeraNino.remeraId, solicitud.remeraId), eq(remeraNino.activo, true)),
    with: { nino: true },
  });
  if (!vinculo || vinculo.nino.tutorId !== tutorId) return null;

  return { solicitud, nino: vinculo.nino };
}

export async function decidirSolicitud(
  solicitudId: string,
  tutorId: string,
  accion: "autorizar" | "rechazar"
) {
  const contexto = await getSolicitudParaDecidir(solicitudId, tutorId);
  if (!contexto) return null;

  const { solicitud } = contexto;
  if (solicitud.estado !== "pendiente") return solicitud; // ya decidida o vencida, no-op

  const ahora = new Date();

  if (accion === "autorizar") {
    const expiraEn = new Date(ahora.getTime() + SOLICITUD_TTL_MINUTOS * 60_000);
    await db.batch([
      db
        .update(solicitudesAcceso)
        .set({ estado: "autorizado", autorizadoEn: ahora, expiraEn, autorizadoPor: tutorId })
        .where(eq(solicitudesAcceso.id, solicitudId)),
      db.insert(accesosLog).values({
        remeraId: solicitud.remeraId,
        solicitudId,
        tipo: "solicitud_autorizada",
      }),
    ]);
  } else {
    await db.batch([
      db
        .update(solicitudesAcceso)
        .set({ estado: "rechazado", autorizadoPor: tutorId })
        .where(eq(solicitudesAcceso.id, solicitudId)),
      db.insert(accesosLog).values({
        remeraId: solicitud.remeraId,
        solicitudId,
        tipo: "solicitud_rechazada",
      }),
    ]);
  }

  return db.query.solicitudesAcceso.findFirst({ where: eq(solicitudesAcceso.id, solicitudId) });
}
