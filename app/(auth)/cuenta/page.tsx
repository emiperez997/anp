"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { OtpInput } from "@/components/ui/OtpInput";
import { StitchDivider } from "@/components/ui/StitchDivider";

type Paso = "celular" | "codigo";

export default function CuentaPage() {
  return (
    <Suspense fallback={null}>
      <CuentaForm />
    </Suspense>
  );
}

function CuentaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/panel";

  const [paso, setPaso] = useState<Paso>("celular");
  const [celular, setCelular] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviarCodigo() {
    setError(null);
    if (celular.trim().length < 8) {
      setError("Revisá el número, parece incompleto.");
      return;
    }
    setCargando(true);
    const res = await fetch("/api/auth/enviar-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ celular }),
    });
    setCargando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No pudimos enviar el código.");
      return;
    }
    setPaso("codigo");
  }

  async function confirmarCodigo() {
    setError(null);
    if (codigo.trim().length !== 6) {
      setError("El código tiene 6 dígitos.");
      return;
    }
    setCargando(true);
    const res = await signIn("sms-otp", {
      celular,
      codigo,
      redirect: false,
    });
    setCargando(false);
    if (res?.error) {
      setError("Código incorrecto o vencido. Pedí uno nuevo.");
      return;
    }
    router.push(callbackUrl);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <div className="overflow-hidden rounded-3xl bg-white">
        <StitchDivider />
        <div className="px-6 py-8">
          {paso === "celular" ? (
            <>
              <h1 className="mb-2 font-voice text-2xl font-medium text-ink">
                Tu número
              </h1>
              <p className="mb-6 text-sm text-ink-muted">
                Te mandamos un código por SMS. Es lo único que necesitás,
                nunca una contraseña.
              </p>
              <PhoneInput
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                disabled={cargando}
              />
              {error && (
                <p className="mt-3 text-sm text-accent-dark">{error}</p>
              )}
              <Button
                className="mt-6"
                onClick={enviarCodigo}
                disabled={cargando}
              >
                {cargando ? "Enviando…" : "Enviar código"}
              </Button>
              <button
                type="button"
                className="mt-3 w-full text-sm text-ink-muted underline"
                onClick={() => signIn("google", { callbackUrl })}
                disabled={cargando}
              >
                Continuar con Google
              </button>
            </>
          ) : (
            <>
              <h1 className="mb-2 font-voice text-2xl font-medium text-ink">
                Código
              </h1>
              <p className="mb-6 text-sm text-ink-muted">
                Te lo mandamos al {celular}.{" "}
                <button
                  type="button"
                  className="text-accent underline"
                  onClick={() => setPaso("celular")}
                >
                  Cambiar número
                </button>
              </p>
              <OtpInput
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                disabled={cargando}
              />
              {error && (
                <p className="mt-3 text-sm text-accent-dark">{error}</p>
              )}
              <Button
                className="mt-6"
                onClick={confirmarCodigo}
                disabled={cargando}
              >
                {cargando ? "Confirmando…" : "Confirmar"}
              </Button>
              <button
                type="button"
                className="mt-4 w-full text-sm text-ink-muted underline"
                onClick={enviarCodigo}
                disabled={cargando}
              >
                Reenviar código
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
