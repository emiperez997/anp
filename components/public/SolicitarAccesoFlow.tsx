"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { StitchDivider } from "@/components/ui/StitchDivider";
import { SOLICITUD_TTL_MINUTOS } from "@/lib/constants";

type EstadoSolicitud = {
  estado: "pendiente" | "autorizado" | "rechazado" | "expirado";
  creadoEn: string;
  expiraEn: string | null;
  remeraToken: string;
};

export function SolicitarAccesoFlow({
  token,
  ninoNombre,
}: {
  token: string;
  ninoNombre: string;
}) {
  const [solicitudId, setSolicitudId] = useState<string | null>(null);

  if (!solicitudId) {
    return <FormularioSolicitud token={token} ninoNombre={ninoNombre} onCreada={setSolicitudId} />;
  }

  return <Espera solicitudId={solicitudId} onPedirDeNuevo={() => setSolicitudId(null)} />;
}

function FormularioSolicitud({
  token,
  ninoNombre,
  onCreada,
}: {
  token: string;
  ninoNombre: string;
  onCreada: (solicitudId: string) => void;
}) {
  const [celular, setCelular] = useState("");
  const [quienDiceSer, setQuienDiceSer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar() {
    setError(null);
    if (celular.trim().length < 8) {
      setError("Dejanos un celular donde te puedan llamar.");
      return;
    }
    setCargando(true);
    const res = await fetch(`/api/remeras/${token}/solicitudes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ celular, quienDiceSer }),
    });
    setCargando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No pudimos enviar el pedido. Probá de nuevo.");
      return;
    }
    const data = await res.json();
    onCreada(data.solicitudId);
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white">
      <StitchDivider />
      <div className="space-y-5 px-6 py-8">
        <div>
          <h1 className="mb-1 font-voice text-2xl font-medium text-ink">Pedir acceso</h1>
          <p className="text-sm text-ink-muted">
            Le avisamos a quien cuida a {ninoNombre} y decide si te muestra más datos, por{" "}
            {SOLICITUD_TTL_MINUTOS} minutos.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Tu celular</label>
          <PhoneInput
            value={celular}
            onChange={(e) => setCelular(e.target.value)}
            disabled={cargando}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            ¿Quién decís ser? (opcional)
          </label>
          <input
            type="text"
            placeholder="Ej: soy la directora del colegio"
            value={quienDiceSer}
            onChange={(e) => setQuienDiceSer(e.target.value)}
            disabled={cargando}
            className="w-full rounded-2xl border border-line bg-white px-4 py-4 text-base text-ink outline-none focus:border-accent disabled:opacity-50"
          />
        </div>

        {error && <p className="text-sm text-accent-dark">{error}</p>}

        <Button variant="outline-sage" onClick={enviar} disabled={cargando}>
          {cargando ? "Enviando…" : "Pedir acceso"}
        </Button>
      </div>
    </div>
  );
}

function Espera({
  solicitudId,
  onPedirDeNuevo,
}: {
  solicitudId: string;
  onPedirDeNuevo: () => void;
}) {
  const { data } = useQuery<EstadoSolicitud>({
    queryKey: ["solicitud", solicitudId],
    queryFn: async () => {
      const res = await fetch(`/api/solicitudes/${solicitudId}`);
      if (!res.ok) throw new Error("No pudimos consultar el pedido");
      return res.json();
    },
    refetchInterval: (query) =>
      query.state.data?.estado === "pendiente" ? 3000 : false,
  });

  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!data) {
    return (
      <div className="overflow-hidden rounded-3xl bg-white">
        <StitchDivider />
        <div className="px-6 py-8 text-center text-sm text-ink-muted">Consultando…</div>
      </div>
    );
  }

  const deadlineMs =
    data.estado === "pendiente"
      ? new Date(data.creadoEn).getTime() + SOLICITUD_TTL_MINUTOS * 60_000
      : data.expiraEn
        ? new Date(data.expiraEn).getTime()
        : null;
  const restanteSeg = deadlineMs ? Math.max(0, Math.floor((deadlineMs - ahora) / 1000)) : null;
  const restanteTexto =
    restanteSeg !== null
      ? `${Math.floor(restanteSeg / 60)}:${String(restanteSeg % 60).padStart(2, "0")}`
      : null;

  return (
    <div className="overflow-hidden rounded-3xl bg-white">
      <StitchDivider />
      <div className="px-6 py-8 text-center">
        {data.estado === "pendiente" && (
          <>
            <p className="mb-1 font-voice text-xl font-medium text-ink">Esperando respuesta</p>
            <p className="mb-4 text-sm text-ink-muted">
              Le avisamos por SMS. Podés esperar acá, no hace falta que hagas nada más.
            </p>
            {restanteTexto && (
              <p className="font-mono text-sm text-muted">Vence en {restanteTexto}</p>
            )}
          </>
        )}

        {data.estado === "autorizado" && (
          <>
            <p className="mb-1 font-voice text-xl font-medium text-sage-dark">¡Te autorizaron!</p>
            <p className="mb-4 text-sm text-ink-muted">
              Tenés acceso ampliado por {restanteTexto ?? `${SOLICITUD_TTL_MINUTOS} min`}.
            </p>
            <Link href={`/r/${data.remeraToken}`}>
              <Button variant="accent">Ver los datos</Button>
            </Link>
          </>
        )}

        {data.estado === "rechazado" && (
          <p className="text-sm text-ink-muted">
            Quien cuida a este chico decidió no autorizar el acceso por ahora. Si es urgente,
            probá llamar directo con el número de la card.
          </p>
        )}

        {data.estado === "expirado" && (
          <>
            <p className="mb-4 text-sm text-ink-muted">
              El pedido venció sin respuesta. Podés intentar de nuevo.
            </p>
            <Button variant="outline-sage" onClick={onPedirDeNuevo}>
              Pedir de nuevo
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
