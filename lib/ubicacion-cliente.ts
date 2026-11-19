export type UbicacionCliente = { lat: number; lng: number; precisionM: number };

export type ResultadoUbicacion =
  | { ok: true; ubicacion: UbicacionCliente }
  | { ok: false; motivo: "denegado" | "no-disponible" };

const CACHE_MAX_MS = 2 * 60_000;
const clave = (token: string) => `anp:ubicacion:${token}`;

export function guardarUbicacion(token: string, ubicacion: UbicacionCliente) {
  try {
    sessionStorage.setItem(clave(token), JSON.stringify({ ubicacion, en: Date.now() }));
  } catch {}
}

export function ubicacionEnCache(token: string): UbicacionCliente | null {
  try {
    const raw = sessionStorage.getItem(clave(token));
    if (!raw) return null;
    const { ubicacion, en } = JSON.parse(raw);
    return Date.now() - en <= CACHE_MAX_MS ? ubicacion : null;
  } catch {
    return null;
  }
}

export function clienteId(): string {
  try {
    let id = sessionStorage.getItem("anp:clienteId");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("anp:clienteId", id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export async function permisoDenegado(): Promise<boolean> {
  try {
    if (sessionStorage.getItem("anp:ubicacionDenegada") === "1") return true;
    const estado = await navigator.permissions?.query({ name: "geolocation" });
    return estado?.state === "denied";
  } catch {
    return false;
  }
}

function marcarDenegado() {
  try {
    sessionStorage.setItem("anp:ubicacionDenegada", "1");
  } catch {}
}

export function pedirUbicacion(timeoutMs: number): Promise<ResultadoUbicacion> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ ok: false, motivo: "no-disponible" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          ok: true,
          ubicacion: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            precisionM: pos.coords.accuracy,
          },
        }),
      (err) => {
        const denegado = err.code === err.PERMISSION_DENIED;
        if (denegado) marcarDenegado();
        resolve({ ok: false, motivo: denegado ? "denegado" : "no-disponible" });
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 }
    );
  });
}
