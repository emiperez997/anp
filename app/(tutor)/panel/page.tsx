import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { ninos } from "@/db/schema";
import { Tag } from "@/components/ui/Tag";
import { StitchDivider } from "@/components/ui/StitchDivider";

export default async function PanelPage() {
  const session = await auth();
  const tutorId = session?.user?.tutorId;
  if (!tutorId) {
    redirect("/cuenta?callbackUrl=/panel");
  }

  const misNinos = await db.query.ninos.findMany({
    where: eq(ninos.tutorId, tutorId),
    with: {
      contactos: true,
      remeraVinculos: { with: { remera: true } },
    },
  });

  return (
    <main className="mx-auto min-h-dvh max-w-sm px-6 py-10">
      <h1 className="mb-6 font-voice text-2xl font-medium text-ink">Tus chicos</h1>

      {misNinos.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Todavía no cargaste ningún chico. Escaneá una remera para empezar.
        </p>
      ) : (
        <ul className="space-y-3">
          {misNinos.map((nino) => {
            const vinculosActivos = nino.remeraVinculos.filter((v) => v.activo);
            const tieneContactoPrincipal = nino.contactos.some((c) => c.esPrincipal);
            const incompleto = !tieneContactoPrincipal || vinculosActivos.length === 0;

            return (
              <li key={nino.id}>
                <Link
                  href={`/panel/${nino.id}`}
                  className="block overflow-hidden rounded-3xl bg-white"
                >
                  <StitchDivider />
                  <div className="flex items-center justify-between px-5 py-5">
                    <div>
                      <p className="font-voice text-lg font-medium text-ink">{nino.nombre}</p>
                      <p className="mt-0.5 font-mono text-xs uppercase tracking-wider text-muted">
                        {vinculosActivos.length > 0
                          ? vinculosActivos.map((v) => v.remera.token).join(", ")
                          : "Sin remera activa"}
                      </p>
                    </div>
                    {incompleto && <Tag emphasis>Datos incompletos</Tag>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
