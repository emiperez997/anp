/**
 * Genera un PNG de QR por cada token de un lote creado con
 * db/generar-lote.ts. Cada QR apunta a {base-url}/r/{token}.
 *
 * Uso: npx tsx scripts/generar-qrs.ts --lote piloto-001 [--base-url https://tu-dominio.com]
 *
 * Guarda los PNGs en db/lotes/{lote}/qrs/{token}.png, nombrados por token
 * para poder emparejar cada imagen con su chip NFC a mano. Esa carpeta NO
 * se commitea (ver .gitignore).
 */
import { mkdir } from "fs/promises";
import path from "path";
import QRCode from "qrcode";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { remeras } from "../db/schema";

function leerArg(nombre: string, porDefecto?: string): string | undefined {
  const idx = process.argv.indexOf(`--${nombre}`);
  if (idx === -1) return porDefecto;
  return process.argv[idx + 1];
}

async function main() {
  const lote = leerArg("lote");
  const baseUrl = leerArg("base-url", "http://localhost:3000");

  if (!lote) {
    console.error("Falta --lote (ej. --lote piloto-001)");
    process.exit(1);
  }

  const remerasDelLote = await db.query.remeras.findMany({
    where: eq(remeras.lote, lote),
  });
  if (remerasDelLote.length === 0) {
    console.error(`No hay remeras con lote "${lote}". ¿Corriste db/generar-lote.ts primero?`);
    process.exit(1);
  }

  const dir = path.join(process.cwd(), "db", "lotes", lote, "qrs");
  await mkdir(dir, { recursive: true });

  for (const remera of remerasDelLote) {
    const url = `${baseUrl}/r/${remera.token}`;
    const filePath = path.join(dir, `${remera.token}.png`);
    await QRCode.toFile(filePath, url, { width: 512, margin: 2 });
  }

  console.log(`Listo. ${remerasDelLote.length} QRs generados en ${dir}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
