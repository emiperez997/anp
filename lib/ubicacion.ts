export type Ubicacion = {
  lat: number;
  lng: number;
  precisionM: number | null;
};

const MAX_PRECISION_M = 100_000;

function redondear5(n: number) {
  return Math.round(n * 1e5) / 1e5;
}

/** Valida lo que manda el cliente. Nunca tira: cualquier cosa rara => null. */
export function parseUbicacion(input: unknown): Ubicacion | null {
  try {
    if (!input || typeof input !== "object") return null;
    const { lat, lng, precisionM } = input as Record<string, unknown>;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

    const precision =
      typeof precisionM === "number" &&
      Number.isFinite(precisionM) &&
      precisionM >= 0 &&
      precisionM <= MAX_PRECISION_M
        ? Math.round(precisionM)
        : null;

    return { lat: redondear5(lat), lng: redondear5(lng), precisionM: precision };
  } catch {
    return null;
  }
}

export function mapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/** Columnas de DB para una ubicación (la hora de captura la pone el server). */
export function columnasUbicacion(u: Ubicacion | null) {
  return {
    ubicacionLat: u?.lat ?? null,
    ubicacionLng: u?.lng ?? null,
    ubicacionPrecisionM: u?.precisionM ?? null,
    ubicacionCapturadaEn: u ? new Date() : null,
  };
}
