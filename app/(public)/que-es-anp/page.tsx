import Link from "next/link";
import { StitchDivider } from "@/components/ui/StitchDivider";

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

export default function QueEsAnpPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <header className="mb-10 flex items-center justify-between">
        <span className="font-voice text-lg font-medium text-ink">ANP</span>
        <Link href="/" className="text-sm font-medium text-ink-muted underline">
          Volver
        </Link>
      </header>

      <section className="mb-10">
        <h1 className="mb-4 font-voice text-3xl font-medium leading-tight text-ink">
          ¿Qué es ANP?
        </h1>
        <p className="text-base leading-relaxed text-ink-muted">
          Una forma de que, si tu hijo se pierde, quien lo encuentre sepa a quién llamar —
          sin exponer más datos de los necesarios, y sin que vos pierdas el control de quién
          los ve.
        </p>
      </section>

      <div className="overflow-hidden rounded-3xl bg-white">
        <StitchDivider />
        <div className="px-6 py-7">
          {PASOS.map((paso, i) => (
            <div key={paso.numero} className={i < PASOS.length - 1 ? "mb-6" : ""}>
              <p className="mb-1 font-mono text-xs text-muted">{paso.numero}</p>
              <h2 className="mb-1 text-base font-medium text-ink">{paso.titulo}</h2>
              <p className="text-sm leading-relaxed text-ink-muted">{paso.texto}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="mt-10 rounded-3xl bg-[var(--anp-tag-bg)] px-6 py-6">
        <p className="mb-1 text-sm font-medium text-ink">Sobre los datos</p>
        <p className="text-sm leading-relaxed text-ink-muted">
          La card pública muestra lo mínimo: nombre, edad, alergias y un botón para llamar.
          Todo lo demás — dirección, escuela, otro contacto — queda oculto hasta que vos lo
          autorizás, y esa autorización dura 15 minutos. Podés ver la card exactamente como
          la ve un desconocido desde tu panel.
        </p>
      </section>

      <footer className="mt-10 text-center text-xs text-muted">
        Piloto en curso. Cualquier duda,{" "}
        <Link href="/" className="underline">
          volvé al inicio
        </Link>
        .
      </footer>
    </main>
  );
}
