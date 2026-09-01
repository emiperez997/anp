/**
 * lib/permisos.ts
 * ---------------------------------------------------------------------------
 * ÚNICO lugar del repo que decide qué campos de un registro puede ver un
 * visitante dado. Tanto la card pública (app/(public)/r/[token]) como la
 * vista del tutor logueado (app/(tutor)/panel/[ninoId]) tienen que consumir
 * esta función en vez de armar su propio SELECT o su propio "if soyDueño".
 *
 * Si el día de mañana agregamos un campo sensible nuevo (ej. "escuela"),
 * se agrega ACÁ, en un solo lugar, y todo lo demás lo hereda.
 * ---------------------------------------------------------------------------
 */

import { db } from "@/db";
import { eq, and, gt } from "drizzle-orm";
import {
  remeras,
  remeraNino,
  ninos,
  contactos,
  solicitudesAcceso,
} from "@/db/schema";

// --- Tipos de salida --------------------------------------------------

/** Lo que ve CUALQUIERA que abra /r/{token}, sin sesión ni solicitud. */
export type VistaPublica = {
  tipo: "publica";
  remeraToken: string;
  ninoId: string;
  nino: {
    nombre: string;
    edad: number | null;
    alergiasNotas: string | null;
    grupoSanguineo: string | null;
  };
  contactoPrincipal: {
    nombre: string;
    celular: string; // el botón "llamar" es el elemento dominante de esta card
  } | null;
  puedePedirAcceso: boolean;
};

/** Lo que se agrega cuando hay una solicitud_acceso autorizada y vigente. */
export type VistaExtendida = Omit<VistaPublica, "tipo"> & {
  tipo: "extendida";
  // TODO: sumar acá los campos sensibles reales cuando se definan
  // (dirección, escuela, segundo contacto) — hoy el modelo de `ninos` no
  // tiene esos campos todavía, agregarlos al schema antes de exponerlos acá.
  contactosSecundarios: {
    nombre: string;
    celular: string;
    relacion: string;
  }[];
  expiraEn: Date;
};

/** Lo que ve el tutor dueño del registro, logueado. */
export type VistaTutor = Omit<VistaExtendida, "tipo"> & {
  tipo: "tutor";
  edicionesRestantes: number;
};

export type VistaRemera = VistaPublica | VistaExtendida | VistaTutor;

// --- Función principal --------------------------------------------------

export async function getVistaRemera(
  token: string,
  sessionTutorId?: string | null
): Promise<VistaRemera | null> {
  const remera = await db.query.remeras.findFirst({
    where: eq(remeras.token, token),
  });
  if (!remera || remera.estado === "dada_de_baja") return null;

  const vinculo = await db.query.remeraNino.findFirst({
    where: and(eq(remeraNino.remeraId, remera.id), eq(remeraNino.activo, true)),
    with: { nino: true },
  });

  // Remera sin datos cargados → el caller decide mostrar el CTA de "Cargar los datos"
  if (!vinculo) return null;

  const nino = vinculo.nino;
  const esDueño = !!sessionTutorId && sessionTutorId === nino.tutorId;

  const contactoPrincipal = await db.query.contactos.findFirst({
    where: and(eq(contactos.ninoId, nino.id), eq(contactos.esPrincipal, true)),
  });

  const base: VistaPublica = {
    tipo: "publica",
    remeraToken: token,
    ninoId: nino.id,
    nino: {
      nombre: nino.nombre,
      edad: calcularEdad(nino.fechaNacimiento),
      alergiasNotas: nino.alergiasNotas,
      grupoSanguineo: nino.grupoSanguineo,
    },
    contactoPrincipal: contactoPrincipal
      ? { nombre: contactoPrincipal.nombre, celular: contactoPrincipal.celular }
      : null,
    puedePedirAcceso: true,
  };

  // El tutor dueño siempre ve todo, sin pasar por el mecanismo de solicitud.
  if (esDueño) {
    return {
      ...base,
      tipo: "tutor",
      contactosSecundarios: await getContactosSecundarios(nino.id),
      expiraEn: new Date(8640000000000000), // no aplica: acceso permanente del dueño
      edicionesRestantes: vinculo.edicionesRestantes,
    };
  }

  // Visitante sin sesión: ¿tiene una solicitud autorizada y vigente ahora mismo?
  const solicitudVigente = await db.query.solicitudesAcceso.findFirst({
    where: and(
      eq(solicitudesAcceso.remeraId, remera.id),
      eq(solicitudesAcceso.estado, "autorizado"),
      gt(solicitudesAcceso.expiraEn, new Date())
    ),
  });

  if (solicitudVigente) {
    return {
      ...base,
      tipo: "extendida",
      contactosSecundarios: await getContactosSecundarios(nino.id),
      expiraEn: solicitudVigente.expiraEn!,
    };
  }

  return base;
}

async function getContactosSecundarios(ninoId: string) {
  const todos = await db.query.contactos.findMany({
    where: eq(contactos.ninoId, ninoId),
  });
  return todos
    .filter((c) => !c.esPrincipal)
    .map((c) => ({ nombre: c.nombre, celular: c.celular, relacion: c.relacion }));
}

function calcularEdad(fechaNacimiento: string | null): number | null {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const noCumplioAunEsteAño =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
  if (noCumplioAunEsteAño) edad -= 1;
  return edad;
}
