import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { inArray, eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { getNinoDeTutor, edicionesRestantesDeNino } from "@/lib/ownership";
import { getVistaRemera } from "@/lib/permisos";
import { accesosLog, solicitudesAcceso } from "@/db/schema";
import { CardRemera } from "@/components/public/CardRemera";
import { Button } from "@/components/ui/Button";

export default async function VistaTutorNinoPage({
  params,
  searchParams,
}: {
  params: Promise<{ ninoId: string }>;
  searchParams: Promise<{ vista?: string }>;
}) {
  const { ninoId } = await params;
  const { vista: vistaParam } = await searchParams;

  const session = await auth();
  const tutorId = session?.user?.tutorId;
  if (!tutorId) {
    redirect(`/cuenta?callbackUrl=/panel/${ninoId}`);
  }

  const nino = await getNinoDeTutor(ninoId, tutorId);
  if (!nino) {
    notFound();
  }

  const primerVinculo = nino.remeraVinculos[0];
  if (!primerVinculo) {
    return (
      <main className="mx-auto min-h-dvh max-w-sm px-6 py-10">
        <p className="text-sm text-ink-muted">
          {nino.nombre} no tiene ninguna remera activa vinculada todavía.
        </p>
      </main>
    );
  }

  const token = primerVinculo.remera.token;
  const esVistaExtraño = vistaParam === "publica";
  const vista = await getVistaRemera(token, esVistaExtraño ? undefined : tutorId);
  if (!vista) {
    notFound();
  }

  const edicionesRestantes = edicionesRestantesDeNino(nino.remeraVinculos);

  const remeraIds = nino.remeraVinculos.map((v) => v.remeraId);
  const accesos = remeraIds.length
    ? await db.query.accesosLog.findMany({
        where: inArray(accesosLog.remeraId, remeraIds),
        orderBy: desc(accesosLog.creadoEn),
        limit: 10,
      })
    : [];

  const pendientes = remeraIds.length
    ? await db.query.solicitudesAcceso.findMany({
        where: and(
          inArray(solicitudesAcceso.remeraId, remeraIds),
          eq(solicitudesAcceso.estado, "pendiente")
        ),
      })
    : [];

  return (
    <main className="mx-auto min-h-dvh max-w-sm px-6 py-10">
      {pendientes.map((p) => (
        <Link
          key={p.id}
          href={`/panel/solicitudes/${p.id}`}
          className="mb-4 block rounded-2xl bg-[var(--anp-tag-accent-bg)] px-4 py-3.5 text-sm font-medium text-accent-dark"
        >
          Alguien pidió acceso — tocá para decidir
        </Link>
      ))}

      <CardRemera vista={vista} />

      <div className="mt-4 flex gap-3">
        <Link href={`/panel/${ninoId}/editar`} className="flex-1">
          <Button variant="outline-sage">
            Editar {edicionesRestantes !== null && `(${edicionesRestantes} rest.)`}
          </Button>
        </Link>
        <Link
          href={esVistaExtraño ? `/panel/${ninoId}` : `/panel/${ninoId}?vista=publica`}
          className="flex-1"
        >
          <Button variant="ghost">
            {esVistaExtraño ? "Volver a mi vista" : "Ver como extraño"}
          </Button>
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl bg-white">
        <div className="border-b border-line px-5 py-4">
          <p className="text-sm font-medium text-ink">Últimos accesos</p>
        </div>
        <div className="px-5 py-4">
          {accesos.length === 0 ? (
            <p className="text-sm text-muted">Todavía no hay accesos registrados.</p>
          ) : (
            <ul className="space-y-2">
              {accesos.map((a) => (
                <li key={a.id} className="text-sm text-ink-muted">
                  {etiquetaTipo(a.tipo)} · {new Date(a.creadoEn).toLocaleString("es-AR")}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

function etiquetaTipo(tipo: string) {
  switch (tipo) {
    case "escaneo":
      return "Escaneo de la remera";
    case "solicitud_creada":
      return "Pidieron acceso";
    case "solicitud_autorizada":
      return "Autorizaste un acceso";
    case "solicitud_rechazada":
      return "Rechazaste un acceso";
    case "solicitud_expirada":
      return "Un pedido de acceso venció";
    default:
      return tipo;
  }
}
