import { db } from "@/db";
import { eq } from "drizzle-orm";
import { ninos } from "@/db/schema";

/**
 * Único punto de entrada para "¿este niño es de este tutor?". Devuelve null
 * tanto si el niño no existe como si pertenece a otro tutor — a propósito,
 * para no filtrar cuál de los dos casos es (se resuelve siempre con notFound()).
 */
export async function getNinoDeTutor(ninoId: string, tutorId: string) {
  const nino = await db.query.ninos.findFirst({
    where: eq(ninos.id, ninoId),
    with: {
      contactos: true,
      remeraVinculos: {
        with: { remera: true },
      },
    },
  });
  if (!nino || nino.tutorId !== tutorId) return null;

  return {
    ...nino,
    remeraVinculos: nino.remeraVinculos.filter((v) => v.activo),
  };
}

/**
 * Ediciones restantes "del niño" = el mínimo entre sus vínculos activos
 * (el contador vive por remera_nino, no por nino — ver db/schema.ts).
 * Sin vínculos activos no hay noción de ediciones restantes.
 */
export function edicionesRestantesDeNino(
  remeraVinculos: { edicionesRestantes: number }[]
): number | null {
  if (remeraVinculos.length === 0) return null;
  return Math.min(...remeraVinculos.map((v) => v.edicionesRestantes));
}
