"use client";

import { useEffect, useState } from "react";
import { clienteId, guardarUbicacion, pedirUbicacion } from "@/lib/ubicacion-cliente";

export function CapturaUbicacion({ token }: { token: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const r = await pedirUbicacion(10_000);
      if (cancelado) return;
      if (!r.ok) {
        setVisible(false);
        return;
      }
      guardarUbicacion(token, r.ubicacion);
      setVisible(false);
      fetch(`/api/remeras/${token}/escaneo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ubicacion: r.ubicacion, clienteId: clienteId() }),
      }).catch(() => {});
    })();
    return () => {
      cancelado = true;
    };
  }, [token]);

  if (!visible) return null;

  return (
    <p className="mb-4 rounded-2xl bg-[var(--anp-tag-bg)] px-4 py-3 text-sm text-ink-muted">
      Si aceptás compartir tu ubicación, se la mostramos a quien cuida a este chico y la
      guardamos 30 días. Es opcional.
    </p>
  );
}
