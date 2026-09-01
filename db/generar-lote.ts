/**
 * Genera un lote de tokens vacíos (remeras sin niño vinculado todavía) para
 * producir los QR/NFC físicos antes de repartirlos. Cada token creado acá
 * queda con estado "activa" y sin ningún vínculo — escanear /r/{token} va a
 * mostrar el CTA de "Cargar los datos" (Pantalla 1) hasta que alguien lo
 * registre desde /r/{token}/registrar.
 *
 * Uso: npx tsx db/generar-lote.ts --lote piloto-001 --cantidad 50 [--talle 6] [--base-url https://tu-dominio.com]
 *
 * Escribe db/lotes/{lote}.csv con token + URL de cada uno. Esa carpeta NO
 * se commitea (ver .gitignore) — es literalmente la lista de "llaves" a
 * cada card antes de tener datos, no debería circular ni quedar en git.
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "./index";
import { remeras } from "./schema";
import { generarTokenRemera } from "../lib/tokens";

function leerArg(nombre: string, porDefecto?: string): string | undefined {
  const idx = process.argv.indexOf(`--${nombre}`);
  if (idx === -1) return porDefecto;
  return process.argv[idx + 1];
}

async function main() {
  const lote = leerArg("lote");
  const cantidad = Number(leerArg("cantidad", "50"));
  const talle = leerArg("talle");
  const baseUrl = leerArg("base-url", "http://localhost:3000");

  if (!lote) {
    console.error("Falta --lote (ej. --lote piloto-001)");
    process.exit(1);
  }
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    console.error("--cantidad tiene que ser un entero positivo");
    process.exit(1);
  }

  console.log(`Generando ${cantidad} tokens para el lote "${lote}"...`);

  const tokens = new Set<string>();
  while (tokens.size < cantidad) {
    tokens.add(generarTokenRemera());
  }

  const filas = [...tokens].map((token) => ({
    token,
    talle: talle ?? null,
    lote,
  }));

  await db.insert(remeras).values(filas);

  const dir = path.join(process.cwd(), "db", "lotes");
  await mkdir(dir, { recursive: true });
  const csvPath = path.join(dir, `${lote}.csv`);
  const csv = [
    "token,url",
    ...filas.map((f) => `${f.token},${baseUrl}/r/${f.token}`),
  ].join("\n");
  await writeFile(csvPath, csv, "utf-8");

  console.log(`Listo. ${cantidad} remeras creadas (estado "activa", lote "${lote}").`);
  console.log(`Lista guardada en ${csvPath}`);
  console.log(`Siguiente paso: npx tsx scripts/generar-qrs.ts --lote ${lote} --base-url ${baseUrl}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
