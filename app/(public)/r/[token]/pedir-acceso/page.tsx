import { notFound } from "next/navigation";
import { esTokenValido } from "@/lib/tokens";
import { getVistaRemera } from "@/lib/permisos";
import { SolicitarAccesoFlow } from "@/components/public/SolicitarAccesoFlow";

export default async function PedirAccesoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!esTokenValido(token)) {
    notFound();
  }

  // Sin sesión: si no hay vista pública (remera sin datos, o dada de baja),
  // no tiene sentido pedir acceso a nada.
  const vista = await getVistaRemera(token);
  if (!vista) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-dvh max-w-sm px-6 py-10">
      <SolicitarAccesoFlow token={token} ninoNombre={vista.nino.nombre} />
    </main>
  );
}
