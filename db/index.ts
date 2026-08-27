import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("Falta DATABASE_URL en .env");
}

// neon-http alcanza para el volumen del piloto y funciona bien en edge/serverless.
// Si más adelante hace falta transacciones interactivas o mucho más throughput,
// se cambia a drizzle-orm/neon-serverless con Pool + WebSockets.
const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
