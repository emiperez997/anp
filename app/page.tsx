import Link from "next/link";
import { redirect } from "next/navigation";
import { StitchDivider } from "@/components/ui/StitchDivider";
import { Button } from "@/components/ui/Button";
import { esTokenValido } from "@/lib/tokens";

const PASOS = [
  {
    numero: "01",
    titulo: "Se cose a la remera",
    texto:
      "Un chip NFC y un código QR, cosidos a una etiqueta de tela. No se rompe, no se moja, no depende de que el chico lleve el celular.",
  },
  {
    numero: "02",
    titulo: "Cualquiera lo escanea",
    texto:
      "Con la cámara del celular o acercando el teléfono al chip. Sin instalar nada. Aparece el nombre, algo que deban saber, y un botón para llamar.",
  },
  {
    numero: "03",
    titulo: "Vos decidís qué más se ve",
    texto:
      "Dirección, escuela, otro contacto: quedan protegidos. Si alguien los necesita, te llega un aviso y decidís ahí, por 15 minutos.",
  },
];

export default async function LandingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  async function irAlCodigo(formData: FormData) {
    "use server";
    const codigo = (formData.get("codigo") as string)?.trim().toUpperCase();
    if (!codigo || !esTokenValido(codigo)) {
      redirect("/?error=1");
    }
    redirect(`/r/${codigo}`);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <header className="mb-10 flex items-center justify-between">
        <span className="font-voice text-lg font-medium text-ink">ANP</span>
        <Link
          href="/cuenta"
          className="text-sm font-medium text-ink-muted underline"
        >
          Ya tengo cuenta
        </Link>
      </header>

      <section className="mb-10">
        <h1 className="mb-4 font-voice text-4xl font-medium leading-tight text-ink">
          Si tu hijo se pierde,
          <br />
          que lo encuentren rápido.
        </h1>
        <p className="mb-6 text-base leading-relaxed text-ink-muted">
          Una etiqueta con QR y NFC, cosida a la remera. Quien la encuentre
          sabe a quién llamar. Vos decidís qué más puede ver, y por cuánto
          tiempo.
        </p>
        <Link href="/cuenta?callbackUrl=/panel">
          <Button variant="accent">Cargar los datos de mi hijo</Button>
        </Link>
      </section>

      <div className="overflow-hidden rounded-3xl bg-white">
        <StitchDivider />
        <div className="px-6 py-7">
          {PASOS.map((paso, i) => (
            <div
              key={paso.numero}
              className={i < PASOS.length - 1 ? "mb-6" : ""}
            >
              <p className="mb-1 font-mono text-xs text-muted">
                {paso.numero}
              </p>
              <h2 className="mb-1 text-base font-medium text-ink">
                {paso.titulo}
              </h2>
              <p className="text-sm leading-relaxed text-ink-muted">
                {paso.texto}
              </p>
            </div>
          ))}
        </div>
      </div>

      <section className="mt-10 rounded-3xl bg-[var(--anp-tag-bg)] px-6 py-6">
        <p className="mb-1 text-sm font-medium text-ink">
          Encontraste una remera con este código
        </p>
        <p className="mb-4 text-xs leading-relaxed text-muted">
          Escribilo tal como está en la etiqueta. Ahí vas a poder llamar
          directo, sin necesidad de cuenta.
        </p>
        <form action={irAlCodigo} className="flex gap-2">
          <input
            name="codigo"
            placeholder="N7K4P2Q8XM"
            maxLength={10}
            className="flex-1 rounded-2xl border border-line bg-white px-4 py-3 font-mono text-sm uppercase tracking-wide text-ink placeholder:normal-case placeholder:text-muted outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-2xl bg-ink px-5 py-3 text-sm font-medium text-white active:scale-[0.98]"
          >
            Ir
          </button>
        </form>

      </section>

      <footer className="mt-10 text-center text-xs text-muted">
        Piloto en curso. Los datos de menores se tratan con cuidado extra —
        ver{" "}
        <Link href="/que-es-anp" className="underline">
          qué es ANP
        </Link>
        .
      </footer>
    </main>
  );
}
