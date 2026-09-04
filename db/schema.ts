import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  smallint,
  timestamp,
  boolean,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const estadoRemeraEnum = pgEnum("estado_remera", [
  "activa",
  "perdida",
  "dada_de_baja",
]);

export const relacionContactoEnum = pgEnum("relacion_contacto", [
  "mama",
  "papa",
  "tutor",
  "otro",
]);

export const estadoSolicitudEnum = pgEnum("estado_solicitud", [
  "pendiente",
  "autorizado",
  "rechazado",
  "expirado",
]);

export const tipoAccesoLogEnum = pgEnum("tipo_acceso_log", [
  "escaneo", // alguien abrió /r/{token}
  "solicitud_creada",
  "solicitud_autorizada",
  "solicitud_rechazada",
  "solicitud_expirada",
]);

// ---------------------------------------------------------------------------
// Tutores (identidad = celular, login sin contraseña vía SMS OTP)
// ---------------------------------------------------------------------------

export const tutores = pgTable(
  "tutores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Nullable: un tutor puede identificarse por celular (login SMS) o por
    // email (login Google), no necesariamente por los dos. Postgres permite
    // múltiples NULL en un índice único, así que ambos grupos conviven sin
    // colisionar entre sí.
    celular: varchar("celular", { length: 20 }), // formato E.164
    email: varchar("email", { length: 255 }),
    nombre: varchar("nombre", { length: 120 }),
    creadoEn: timestamp("creado_en", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    celularUnico: uniqueIndex("tutores_celular_idx").on(t.celular),
    emailUnico: uniqueIndex("tutores_email_idx").on(t.email),
  })
);

// ---------------------------------------------------------------------------
// Niños
// ---------------------------------------------------------------------------

export const ninos = pgTable("ninos", {
  id: uuid("id").defaultRandom().primaryKey(),
  tutorId: uuid("tutor_id")
    .notNull()
    .references(() => tutores.id, { onDelete: "cascade" }), // dueño/creador
  nombre: varchar("nombre", { length: 120 }).notNull(),
  fechaNacimiento: date("fecha_nacimiento"),
  alergiasNotas: text("alergias_notas"), // texto libre, opcional
  grupoSanguineo: varchar("grupo_sanguineo", { length: 5 }), // ej "O+"
  obraSocial: varchar("obra_social", { length: 120 }),
  creadoEn: timestamp("creado_en", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ---------------------------------------------------------------------------
// Remeras (una remera = un token físico, QR/NFC)
// ---------------------------------------------------------------------------

export const remeras = pgTable(
  "remeras",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    token: varchar("token", { length: 32 }).notNull(), // nanoid, no secuencial
    talle: varchar("talle", { length: 10 }),
    lote: varchar("lote", { length: 40 }),
    estado: estadoRemeraEnum("estado").default("activa").notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    tokenUnico: uniqueIndex("remeras_token_idx").on(t.token),
  })
);

// ---------------------------------------------------------------------------
// Vínculo remera <-> niño (1 niño puede tener varias remeras activas)
// El contador de ediciones vive acá: es por vínculo, tope 3.
// ---------------------------------------------------------------------------

export const remeraNino = pgTable(
  "remera_nino",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    remeraId: uuid("remera_id")
      .notNull()
      .references(() => remeras.id, { onDelete: "cascade" }),
    ninoId: uuid("nino_id")
      .notNull()
      .references(() => ninos.id, { onDelete: "cascade" }),
    edicionesRestantes: smallint("ediciones_restantes").default(3).notNull(),
    activo: boolean("activo").default(true).notNull(),
    vinculadoEn: timestamp("vinculado_en", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    remeraNinoUnico: uniqueIndex("remera_nino_unico_idx").on(
      t.remeraId,
      t.ninoId
    ),
  })
);

// ---------------------------------------------------------------------------
// Contactos (info sensible — nunca se joinea en la card pública)
// ---------------------------------------------------------------------------

export const contactos = pgTable("contactos", {
  id: uuid("id").defaultRandom().primaryKey(),
  ninoId: uuid("nino_id")
    .notNull()
    .references(() => ninos.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 120 }).notNull(),
  celular: varchar("celular", { length: 20 }).notNull(),
  relacion: relacionContactoEnum("relacion").notNull(),
  esPrincipal: boolean("es_principal").default(false).notNull(),
});

// ---------------------------------------------------------------------------
// Solicitudes de acceso — el corazón del producto
// ---------------------------------------------------------------------------

export const solicitudesAcceso = pgTable(
  "solicitudes_acceso",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    remeraId: uuid("remera_id")
      .notNull()
      .references(() => remeras.id, { onDelete: "cascade" }),
    celularSolicitante: varchar("celular_solicitante", { length: 20 }),
    quienDiceSer: text("quien_dice_ser"), // texto libre
    estado: estadoSolicitudEnum("estado").default("pendiente").notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true })
      .defaultNow()
      .notNull(),
    autorizadoEn: timestamp("autorizado_en", { withTimezone: true }),
    expiraEn: timestamp("expira_en", { withTimezone: true }), // autorizadoEn + 15 min
    autorizadoPor: uuid("autorizado_por").references(() => tutores.id),
  },
  (t) => ({
    // el cron de expiración recorre pendientes/autorizados por expirar
    estadoIdx: index("solicitudes_estado_idx").on(t.estado, t.expiraEn),
    remeraIdx: index("solicitudes_remera_idx").on(t.remeraId),
  })
);

// ---------------------------------------------------------------------------
// Log de accesos (para el panel del tutor: "últimos accesos")
// ---------------------------------------------------------------------------

export const accesosLog = pgTable(
  "accesos_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    remeraId: uuid("remera_id")
      .notNull()
      .references(() => remeras.id, { onDelete: "cascade" }),
    solicitudId: uuid("solicitud_id").references(() => solicitudesAcceso.id, {
      onDelete: "set null",
    }),
    tipo: tipoAccesoLogEnum("tipo").notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    remeraIdx: index("accesos_log_remera_idx").on(t.remeraId, t.creadoEn),
  })
);

// ---------------------------------------------------------------------------
// Relations (para queries con `db.query.X.findMany({ with: { ... } })`)
// ---------------------------------------------------------------------------

export const tutoresRelations = relations(tutores, ({ many }) => ({
  ninos: many(ninos),
}));

export const ninosRelations = relations(ninos, ({ one, many }) => ({
  tutor: one(tutores, {
    fields: [ninos.tutorId],
    references: [tutores.id],
  }),
  contactos: many(contactos),
  remeraVinculos: many(remeraNino),
}));

export const remerasRelations = relations(remeras, ({ many }) => ({
  ninoVinculos: many(remeraNino),
  solicitudesAcceso: many(solicitudesAcceso),
  accesosLog: many(accesosLog),
}));

export const remeraNinoRelations = relations(remeraNino, ({ one }) => ({
  remera: one(remeras, {
    fields: [remeraNino.remeraId],
    references: [remeras.id],
  }),
  nino: one(ninos, {
    fields: [remeraNino.ninoId],
    references: [ninos.id],
  }),
}));

export const contactosRelations = relations(contactos, ({ one }) => ({
  nino: one(ninos, {
    fields: [contactos.ninoId],
    references: [ninos.id],
  }),
}));

export const solicitudesAccesoRelations = relations(
  solicitudesAcceso,
  ({ one, many }) => ({
    remera: one(remeras, {
      fields: [solicitudesAcceso.remeraId],
      references: [remeras.id],
    }),
    autorizadoPorTutor: one(tutores, {
      fields: [solicitudesAcceso.autorizadoPor],
      references: [tutores.id],
    }),
    accesosLog: many(accesosLog),
  })
);

export const accesosLogRelations = relations(accesosLog, ({ one }) => ({
  remera: one(remeras, {
    fields: [accesosLog.remeraId],
    references: [remeras.id],
  }),
  solicitud: one(solicitudesAcceso, {
    fields: [accesosLog.solicitudId],
    references: [solicitudesAcceso.id],
  }),
}));
