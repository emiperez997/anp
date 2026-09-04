import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getNinoDeTutor, edicionesRestantesDeNino } from "@/lib/ownership";
import { FormularioNino } from "@/components/tutor/FormularioNino";

export default async function EditarNinoPage({
  params,
}: {
  params: Promise<{ ninoId: string }>;
}) {
  const { ninoId } = await params;

  const session = await auth();
  const tutorId = session?.user?.tutorId;
  if (!tutorId) {
    redirect(`/cuenta?callbackUrl=/panel/${ninoId}/editar`);
  }

  const nino = await getNinoDeTutor(ninoId, tutorId);
  if (!nino) {
    notFound();
  }

  const edicionesRestantes = edicionesRestantesDeNino(nino.remeraVinculos);
  if (edicionesRestantes === null) {
    notFound();
  }

  const contactoPrincipal = nino.contactos.find((c) => c.esPrincipal);

  return (
    <main className="mx-auto min-h-dvh max-w-sm px-6 py-10">
      <FormularioNino
        modo="editar"
        endpoint={`/api/ninos/${ninoId}`}
        method="PATCH"
        redirectTo={`/panel/${ninoId}`}
        edicionesRestantes={edicionesRestantes}
        valoresIniciales={{
          nombre: nino.nombre,
          alergiasNotas: nino.alergiasNotas ?? "",
          contactoNombre: contactoPrincipal?.nombre ?? "",
          contactoCelular: contactoPrincipal?.celular ?? "",
          contactoRelacion: contactoPrincipal?.relacion ?? "mama",
        }}
      />
    </main>
  );
}
