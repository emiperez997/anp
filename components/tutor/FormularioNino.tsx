"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { StitchDivider } from "@/components/ui/StitchDivider";

const RELACIONES = [
  { value: "mama", label: "Mamá" },
  { value: "papa", label: "Papá" },
  { value: "tutor", label: "Tutor/a" },
  { value: "otro", label: "Otro" },
] as const;

export type ValoresNino = {
  nombre: string;
  contactoNombre: string;
  contactoCelular: string;
  contactoRelacion: (typeof RELACIONES)[number]["value"];
  alergiasNotas: string;
};

type Props = {
  modo: "crear" | "editar";
  endpoint: string;
  method: "POST" | "PATCH";
  redirectTo: string;
  valoresIniciales?: Partial<ValoresNino>;
  edicionesRestantes?: number | null;
};

export function FormularioNino({
  modo,
  endpoint,
  method,
  redirectTo,
  valoresIniciales,
  edicionesRestantes,
}: Props) {
  const router = useRouter();
  const [valores, setValores] = useState<ValoresNino>({
    nombre: valoresIniciales?.nombre ?? "",
    contactoNombre: valoresIniciales?.contactoNombre ?? "",
    contactoCelular: valoresIniciales?.contactoCelular ?? "",
    contactoRelacion: valoresIniciales?.contactoRelacion ?? "mama",
    alergiasNotas: valoresIniciales?.alergiasNotas ?? "",
  });
  const [consentimiento, setConsentimiento] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const sinEdicionesDisponibles =
    modo === "editar" && edicionesRestantes !== undefined && edicionesRestantes !== null && edicionesRestantes <= 0;

  function actualizar<K extends keyof ValoresNino>(campo: K, valor: ValoresNino[K]) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }

  async function enviar() {
    setError(null);

    if (valores.nombre.trim().length < 2) {
      setError("Falta el nombre del chico.");
      return;
    }
    if (valores.contactoNombre.trim().length < 2 || valores.contactoCelular.trim().length < 8) {
      setError("Completá a quién llamar (nombre y celular).");
      return;
    }
    if (!consentimiento) {
      setError("Necesitamos el consentimiento para guardar datos de un menor.");
      return;
    }

    setCargando(true);
    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...valores, consentimiento }),
    });
    setCargando(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No pudimos guardar los datos. Probá de nuevo.");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white">
      <StitchDivider />
      <div className="space-y-6 px-6 py-8">
        <div>
          <h1 className="mb-1 font-voice text-2xl font-medium text-ink">
            {modo === "crear" ? "Cargar los datos" : "Editar los datos"}
          </h1>
          <p className="text-sm text-ink-muted">
            Nombre del chico, a quién llamar, y algo que deban saber si hace falta.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Nombre del chico</label>
          <input
            type="text"
            value={valores.nombre}
            onChange={(e) => actualizar("nombre", e.target.value)}
            disabled={cargando || sinEdicionesDisponibles}
            className="w-full rounded-2xl border border-line bg-white px-4 py-4 text-base text-ink outline-none focus:border-accent disabled:opacity-50"
          />
        </div>

        <div className="space-y-3 border-t border-line pt-5">
          <p className="text-sm font-medium text-ink">A quién llamar</p>
          <input
            type="text"
            placeholder="Nombre"
            value={valores.contactoNombre}
            onChange={(e) => actualizar("contactoNombre", e.target.value)}
            disabled={cargando || sinEdicionesDisponibles}
            className="w-full rounded-2xl border border-line bg-white px-4 py-4 text-base text-ink outline-none focus:border-accent disabled:opacity-50"
          />
          <PhoneInput
            value={valores.contactoCelular}
            onChange={(e) => actualizar("contactoCelular", e.target.value)}
            disabled={cargando || sinEdicionesDisponibles}
          />
          <select
            value={valores.contactoRelacion}
            onChange={(e) => actualizar("contactoRelacion", e.target.value as ValoresNino["contactoRelacion"])}
            disabled={cargando || sinEdicionesDisponibles}
            className="w-full rounded-2xl border border-line bg-white px-4 py-4 text-base text-ink outline-none focus:border-accent disabled:opacity-50"
          >
            {RELACIONES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t border-line pt-5">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Algo que deban saber (opcional)
          </label>
          <textarea
            value={valores.alergiasNotas}
            onChange={(e) => actualizar("alergiasNotas", e.target.value)}
            disabled={cargando || sinEdicionesDisponibles}
            placeholder="Alergias, medicación, lo que sea importante"
            rows={3}
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-base text-ink outline-none focus:border-accent disabled:opacity-50"
          />
        </div>

        <div className="border-t border-line pt-5">
          <label className="flex items-start gap-2.5 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={consentimiento}
              onChange={(e) => setConsentimiento(e.target.checked)}
              disabled={cargando || sinEdicionesDisponibles}
              className="mt-0.5"
            />
            <span>
              Confirmo que soy el tutor/a de este chico y autorizo a guardar estos datos
              para que puedan usarse si lo encuentran perdido.
            </span>
          </label>
        </div>

        {sinEdicionesDisponibles && (
          <p className="text-sm text-accent-dark">
            Ya usaste las 3 ediciones disponibles para este registro.
          </p>
        )}
        {error && <p className="text-sm text-accent-dark">{error}</p>}

        <Button onClick={enviar} disabled={cargando || sinEdicionesDisponibles}>
          {cargando ? "Guardando…" : modo === "crear" ? "Guardar" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}
