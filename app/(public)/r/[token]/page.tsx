import Link from "next/link";
import { auth } from "@/lib/auth";
import { getVistaRemera } from "@/lib/permisos";
import { esTokenValido } from "@/lib/tokens";
import { CardRemera } from "@/components/public/CardRemera";
import { Button } from "@/components/ui/Button";
import { StitchDivider } from "@/components/ui/StitchDivider";
import { log } from "console";

export default async function RemeraPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!esTokenValido(token)) {
    log(token)
    return <EstadoNeutral token={token} error="Ese código no es válido." />;
  }

  const session = await auth();

  const tutorId: string | undefined = session?.user?.tutorId;

  const vista = await getVistaRemera(token, tutorId);

  // Remera sin niño vinculado todavía -> Pantalla 1, CTA de carga.
  if (!vista) {
    return <EstadoNeutral token={token} />;
  }

  return (
    <main className="mx-auto min-h-dvh max-w-sm px-6 py-10">
      <CardRemera vista={vista} />

      {vista.tipo === "tutor" && (
        <div className="mt-4 flex gap-3">
          <Link
            href={`/panel/${vista.remeraToken}/editar`}
            className="flex-1"
          >
            <Button variant="outline-sage">Editar</Button>
          </Link>
          <Link href={`/r/${token}?vista=publica`} className="flex-1">
            <Button variant="ghost">Ver como extraño</Button>
          </Link>
        </div>
      )}
    </main>
  );
}

/**
 * Pantalla 1 (Escaneo): landing neutra cuando la remera todavía no tiene
 * datos cargados. No distingue tutor de desconocido — el login recién
 * aparece si alguien toca "Cargar los datos".
 */
function EstadoNeutral({ token, error }: { token: string; error?: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <div className="overflow-hidden rounded-3xl bg-white">
        <StitchDivider />
        <div className="px-6 py-8 text-center">
          <p className="mb-1 font-mono text-xs uppercase tracking-wider text-muted">
            Remera {token}
          </p>
          {error ? (
            <p className="mb-6 mt-4 text-sm text-accent-dark">{error}</p>
          ) : (
            <p className="mb-6 mt-4 text-sm text-ink-muted">
              Esta remera todavía no tiene datos cargados. Si sos el
              tutor, podés cargarlos ahora.
            </p>
          )}
          {!error && (
            <Link href={`/cuenta?callbackUrl=/r/${token}/registrar`}>
              <Button variant="accent">Cargar los datos</Button>
            </Link>
          )}
          <Link
            href="/que-es-anp"
            className="mt-4 block text-sm text-muted underline"
          >
            ¿Qué es ANP?
          </Link>
        </div>
      </div>
    </main>
  );
}
