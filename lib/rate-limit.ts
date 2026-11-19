/**
 * Rate limit en memoria, por IP. Best-effort: cada instancia serverless tiene
 * su propio contador, así que no es un límite global — solo frena abuso básico.
 */
const ventanas = new Map<string, { desde: number; cuenta: number }>();
const VENTANA_MS = 60_000;

export function ipDe(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "desconocida"
  );
}

export function excedeLimite(request: Request, ruta: string, max = 20) {
  const ahora = Date.now();
  if (ventanas.size > 5000) {
    for (const [k, v] of ventanas) if (ahora - v.desde > VENTANA_MS) ventanas.delete(k);
  }
  const clave = `${ruta}:${ipDe(request)}`;
  const v = ventanas.get(clave);
  if (!v || ahora - v.desde > VENTANA_MS) {
    ventanas.set(clave, { desde: ahora, cuenta: 1 });
    return false;
  }
  v.cuenta += 1;
  return v.cuenta > max;
}
