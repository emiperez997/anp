import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { remeras, remeraNino, accesosLog } from "@/db/schema";

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
