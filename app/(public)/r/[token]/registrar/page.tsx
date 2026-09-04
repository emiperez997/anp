import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { esTokenValido } from "@/lib/tokens";
import { remeras, remeraNino } from "@/db/schema";
import { FormularioNino } from "@/components/tutor/FormularioNino";

export default async function RegistrarPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const session = await auth();
  if (!session?.user?.tutorId) {
    redirect(`/cuenta?callbackUrl=/r/${token}/registrar`);
  }

  if (!esTokenValido(token)) {
    return <EstadoError mensaje="Ese código no es válido." />;
  }

  const remera = await db.query.remeras.findFirst({ where: eq(remeras.token, token) });
  if (!remera) {
    return <EstadoError mensaje="No encontramos esa remera." />;
  }

  const vinculoExistente = await db.query.remeraNino.findFirst({
    where: and(eq(remeraNino.remeraId, remera.id), eq(remeraNino.activo, true)),
  });
  if (vinculoExistente) {
    redirect(`/r/${token}`);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-sm px-6 py-10">
      <FormularioNino
        modo="crear"
        endpoint={`/api/remeras/${token}/registrar`}
        method="POST"
        redirectTo={`/r/${token}`}
      />
    </main>
  );
}

function EstadoError({ mensaje }: { mensaje: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10 text-center">
      <p className="text-sm text-accent-dark">{mensaje}</p>
    </main>
  );
}
