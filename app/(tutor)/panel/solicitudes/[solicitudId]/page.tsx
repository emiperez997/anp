import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSolicitudParaDecidir } from "@/lib/solicitudes";
import { DecisionSolicitud } from "@/components/tutor/DecisionSolicitud";

export default async function SolicitudPage({
  params,
}: {
  params: Promise<{ solicitudId: string }>;
}) {
  const { solicitudId } = await params;

  const session = await auth();
  const tutorId = session?.user?.tutorId;
  if (!tutorId) {
    redirect(`/cuenta?callbackUrl=/panel/solicitudes/${solicitudId}`);
  }

  const contexto = await getSolicitudParaDecidir(solicitudId, tutorId);
  if (!contexto) {
    notFound();
  }

  const { solicitud, nino } = contexto;

  return (
    <main className="mx-auto min-h-dvh max-w-sm px-6 py-10">
      <DecisionSolicitud
        solicitudId={solicitud.id}
        estadoInicial={solicitud.estado}
        ninoNombre={nino.nombre}
        celularSolicitante={solicitud.celularSolicitante ?? ""}
        quienDiceSer={solicitud.quienDiceSer}
      />
    </main>
  );
}
