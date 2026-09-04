"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StitchDivider } from "@/components/ui/StitchDivider";

type Estado = "pendiente" | "autorizado" | "rechazado" | "expirado";

export function DecisionSolicitud({
  solicitudId,
  estadoInicial,
  ninoNombre,
  celularSolicitante,
  quienDiceSer,
}: {
  solicitudId: string;
  estadoInicial: Estado;
  ninoNombre: string;
  celularSolicitante: string;
  quienDiceSer: string | null;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>(estadoInicial);
  const [cargando, setCargando] = useState<"autorizar" | "rechazar" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decidir(accion: "autorizar" | "rechazar") {
    setError(null);
    setCargando(accion);
    const res = await fetch(`/api/solicitudes/${solicitudId}/decidir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion }),
    });
    setCargando(null);
    if (!res.ok) {
      setError("No pudimos guardar tu decisión. Probá de nuevo.");
      return;
    }
    const data = await res.json();
    setEstado(data.estado);
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white">
      <StitchDivider />
      <div className="space-y-5 px-6 py-8">
        <div>
          <h1 className="mb-1 font-voice text-2xl font-medium text-ink">Pidieron acceso</h1>
          <p className="text-sm text-ink-muted">
            Alguien quiere ver más datos de {ninoNombre}.
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--anp-tag-bg)] px-4 py-3.5 text-sm text-ink">
          <p>
            <span className="text-ink-muted">Dice ser:</span>{" "}
            {quienDiceSer ?? "no dijo quién es"}
          </p>
          <p className="mt-1">
            <span className="text-ink-muted">Celular:</span> {celularSolicitante}
          </p>
        </div>

        {estado === "pendiente" ? (
          <>
            <a
              href={`tel:${celularSolicitante}`}
              className="block w-full rounded-2xl border border-line px-4 py-4 text-center text-base font-medium text-ink active:scale-[0.98]"
            >
              Llamarlo antes de decidir
            </a>

            {error && <p className="text-sm text-accent-dark">{error}</p>}

            <Button
              variant="outline-sage"
              onClick={() => decidir("autorizar")}
              disabled={cargando !== null}
            >
              {cargando === "autorizar" ? "Autorizando…" : "Autorizar por 15 minutos"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => decidir("rechazar")}
              disabled={cargando !== null}
            >
              {cargando === "rechazar" ? "Guardando…" : "No autorizar"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-ink-muted">
            {estado === "autorizado" && "Ya autorizaste este pedido por 15 minutos."}
            {estado === "rechazado" && "Ya rechazaste este pedido."}
            {estado === "expirado" && "Este pedido venció sin que lo decidieras."}
          </p>
        )}
      </div>
    </div>
  );
}
