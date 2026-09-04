/**
 * Constantes compartidas entre server y client components — a diferencia de
 * lib/solicitudes.ts, este archivo no puede importar nada de "@/db" (se
 * empaqueta también en el cliente, para mostrar countdowns).
 */
export const SOLICITUD_TTL_MINUTOS = 15;
