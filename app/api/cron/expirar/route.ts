import { NextResponse } from "next/server";
import { eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { solicitudesAcceso, accesosLog } from "@/db/schema";
import { SOLICITUD_TTL_MINUTOS } from "@/lib/solicitudes";
import { UBICACION_RETENCION_DIAS } from "@/lib/constants";

/**
 * Corre cada minuto (ver vercel.json). Vercel agrega automáticamente
 * `Authorization: Bearer $CRON_SECRET` cuando invoca este endpoint —
 * cualquier otro caller sin ese header se rechaza.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ahora = new Date();
  const limitePendientes = new Date(ahora.getTime() - SOLICITUD_TTL_MINUTOS * 60_000);

  const vencidas = await db.query.solicitudesAcceso.findMany({
    where: (s, { or, and, eq, lt }) =>
      or(
        and(eq(s.estado, "pendiente"), lt(s.creadoEn, limitePendientes)),
        and(eq(s.estado, "autorizado"), lt(s.expiraEn, ahora))
      ),
  });

  for (const solicitud of vencidas) {
    await db.batch([
      db
        .update(solicitudesAcceso)
        .set({ estado: "expirado" })
        .where(eq(solicitudesAcceso.id, solicitud.id)),
      db.insert(accesosLog).values({
        remeraId: solicitud.remeraId,
        solicitudId: solicitud.id,
        tipo: "solicitud_expirada",
      }),
    ]);
  }

  // Retención de ubicaciones; separado para que un fallo no afecte la expiración
  try {
  const limiteUbicacion = new Date(ahora.getTime() - UBICACION_RETENCION_DIAS * 24 * 60 * 60_000);
  const nulos = {
    ubicacionLat: null,
    ubicacionLng: null,
    ubicacionPrecisionM: null,
    ubicacionCapturadaEn: null,
  };
  await db.batch([
    db
      .update(solicitudesAcceso)
      .set(nulos)
      .where(lt(solicitudesAcceso.ubicacionCapturadaEn, limiteUbicacion)),
    db
      .update(accesosLog)
      .set(nulos)
      .where(lt(accesosLog.ubicacionCapturadaEn, limiteUbicacion)),
  ]);
  } catch (err) {
    console.error("No se pudo limpiar ubicaciones vencidas", err);
  }

  return NextResponse.json({ expiradas: vencidas.length });
}
