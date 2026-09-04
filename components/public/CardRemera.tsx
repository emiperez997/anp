import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { StitchDivider } from "@/components/ui/StitchDivider";
import type { VistaRemera } from "@/lib/permisos";

export function CardRemera({ vista }: { vista: VistaRemera }) {
  const { nino, contactoPrincipal, remeraToken } = vista;

  return (
    <div className="overflow-hidden rounded-3xl bg-white">
      <StitchDivider />
      <div className="px-5 py-7">
        <p className="mb-1 font-mono text-xs uppercase tracking-wider text-muted">
          Remera {remeraToken}
        </p>
        <h1 className="mb-4 font-voice text-3xl font-medium text-ink">
          {nino.nombre}
        </h1>

        <div className="mb-6 flex flex-wrap gap-2">
          {nino.edad !== null && <Tag>{nino.edad} años</Tag>}
          {nino.alergiasNotas && (
            <Tag emphasis>{nino.alergiasNotas}</Tag>
          )}
          {nino.grupoSanguineo && <Tag>Grupo {nino.grupoSanguineo}</Tag>}
        </div>

        {contactoPrincipal ? (
          <>
            {/* Es un <a href="tel:..."> estilado como el Button de acento,
                no un <button> real: dispara el marcador nativo del celular,
                no requiere JS ni handler. */}
            <a
              href={`tel:${contactoPrincipal.celular}`}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-4 text-lg font-medium text-white active:scale-[0.98]"
            >
              Llamar a {contactoPrincipal.nombre}
            </a>
            <p className="mt-2.5 text-center text-xs text-muted">
              Está esperando esta llamada
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">
            Todavía no hay un contacto principal cargado.
          </p>
        )}
      </div>

      {vista.tipo === "publica" && vista.puedePedirAcceso && (
        <div className="border-t border-line px-5 py-5">
          <p className="mb-1 text-sm font-medium text-ink">
            ¿Necesitás más datos?
          </p>
          <p className="mb-3 text-xs leading-relaxed text-muted">
            Dirección, escuela y otro contacto están protegidos. Pedí acceso
            y el tutor decide.
          </p>
          <Link href={`/r/${remeraToken}/pedir-acceso`}>
            <Button variant="outline-sage">Pedir acceso</Button>
          </Link>
        </div>
      )}

      {(vista.tipo === "extendida" || vista.tipo === "tutor") && (
        <div className="border-t border-line px-5 py-5">
          <p className="mb-3 text-sm font-medium text-sage-dark">
            Acceso ampliado activo
          </p>
          {vista.contactosSecundarios.map((c) => (
            <a
              key={c.celular}
              href={`tel:${c.celular}`}
              className="mb-2 flex items-center justify-between rounded-2xl bg-[var(--anp-tag-bg)] px-3 py-2.5 text-sm text-ink"
            >
              <span>
                {c.nombre} · {c.relacion}
              </span>
              <span className="text-accent">Llamar</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
