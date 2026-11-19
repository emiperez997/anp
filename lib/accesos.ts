import { db } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { remeras, remeraNino, accesosLog } from "@/db/schema";
import { columnasUbicacion, type Ubicacion } from "@/lib/ubicacion";

/**
 * Registra un "escaneo" en accesos_log SOLO si quien mira /r/{token} no es
 * el tutor dueño del registro. Se llama desde la ruta pública, nunca desde
 * el panel del tutor (que ya exige ser el dueño para renderizar nada).
 */
export async function registrarAccesoSiEsExterno(
  token: string,
  sessionTutorId?: string | null
) {
  const remera = await db.query.remeras.findFirst({
    where: eq(remeras.token, token),
  });
  if (!remera) return;

  const vinculo = await db.query.remeraNino.findFirst({
    where: and(eq(remeraNino.remeraId, remera.id), eq(remeraNino.activo, true)),
    with: { nino: true },
  });
  if (!vinculo) return;

  const esDueño = !!sessionTutorId && sessionTutorId === vinculo.nino.tutorId;
  if (esDueño) return;

  await db.insert(accesosLog).values({
    remeraId: remera.id,
    tipo: "escaneo",
  });
}

const DEDUPE_ESCANEO_MS = 5 * 60_000;

/**
 * Registra un escaneo con ubicación. Devuelve false si el token no existe,
 * si quien escanea es el tutor dueño, o si este cliente ya registró uno en los últimos 5 min.
 */
export async function registrarEscaneoUbicacion(
  token: string,
  ubicacion: Ubicacion,
  clienteId: string,
  sessionTutorId?: string | null
) {
  const remera = await db.query.remeras.findFirst({ where: eq(remeras.token, token) });
  if (!remera || remera.estado === "dada_de_baja") return false;

  const vinculo = await db.query.remeraNino.findFirst({
    where: and(eq(remeraNino.remeraId, remera.id), eq(remeraNino.activo, true)),
    with: { nino: true },
  });
  if (!vinculo) return false;
  if (sessionTutorId && sessionTutorId === vinculo.nino.tutorId) return false;

  const c = columnasUbicacion(ubicacion);
  const desde = new Date(Date.now() - DEDUPE_ESCANEO_MS);

  // Un solo INSERT ... WHERE NOT EXISTS: dedupe por (remera, cliente) en 5 min.
  const res = await db.execute(sql`
    INSERT INTO accesos_log
      (remera_id, tipo, cliente_id, ubicacion_lat, ubicacion_lng, ubicacion_precision_m, ubicacion_capturada_en)
    SELECT ${remera.id}::uuid, 'escaneo_ubicacion', ${clienteId}, ${c.ubicacionLat}::double precision,
      ${c.ubicacionLng}::double precision, ${c.ubicacionPrecisionM}::real, ${c.ubicacionCapturadaEn!.toISOString()}::timestamptz
    WHERE NOT EXISTS (
      SELECT 1 FROM accesos_log
      WHERE remera_id = ${remera.id}::uuid AND tipo = 'escaneo_ubicacion'
        AND cliente_id = ${clienteId} AND creado_en > ${desde.toISOString()}::timestamptz
    )
    RETURNING id`);
  return res.rows.length > 0;
}
