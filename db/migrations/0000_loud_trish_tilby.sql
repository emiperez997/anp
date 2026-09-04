CREATE TYPE "public"."estado_remera" AS ENUM('activa', 'perdida', 'dada_de_baja');--> statement-breakpoint
CREATE TYPE "public"."estado_solicitud" AS ENUM('pendiente', 'autorizado', 'rechazado', 'expirado');--> statement-breakpoint
CREATE TYPE "public"."relacion_contacto" AS ENUM('mama', 'papa', 'tutor', 'otro');--> statement-breakpoint
CREATE TYPE "public"."tipo_acceso_log" AS ENUM('escaneo', 'solicitud_creada', 'solicitud_autorizada', 'solicitud_rechazada', 'solicitud_expirada');--> statement-breakpoint
CREATE TABLE "accesos_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"remera_id" uuid NOT NULL,
	"solicitud_id" uuid,
	"tipo" "tipo_acceso_log" NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contactos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nino_id" uuid NOT NULL,
	"nombre" varchar(120) NOT NULL,
	"celular" varchar(20) NOT NULL,
	"relacion" "relacion_contacto" NOT NULL,
	"es_principal" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ninos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tutor_id" uuid NOT NULL,
	"nombre" varchar(120) NOT NULL,
	"fecha_nacimiento" date,
	"alergias_notas" text,
	"grupo_sanguineo" varchar(5),
	"obra_social" varchar(120),
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "remera_nino" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"remera_id" uuid NOT NULL,
	"nino_id" uuid NOT NULL,
	"ediciones_restantes" smallint DEFAULT 3 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"vinculado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "remeras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(32) NOT NULL,
	"talle" varchar(10),
	"lote" varchar(40),
	"estado" "estado_remera" DEFAULT 'activa' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solicitudes_acceso" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"remera_id" uuid NOT NULL,
	"celular_solicitante" varchar(20),
	"quien_dice_ser" text,
	"estado" "estado_solicitud" DEFAULT 'pendiente' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"autorizado_en" timestamp with time zone,
	"expira_en" timestamp with time zone,
	"autorizado_por" uuid
);
--> statement-breakpoint
CREATE TABLE "tutores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"celular" varchar(20) NOT NULL,
	"nombre" varchar(120),
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accesos_log" ADD CONSTRAINT "accesos_log_remera_id_remeras_id_fk" FOREIGN KEY ("remera_id") REFERENCES "public"."remeras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accesos_log" ADD CONSTRAINT "accesos_log_solicitud_id_solicitudes_acceso_id_fk" FOREIGN KEY ("solicitud_id") REFERENCES "public"."solicitudes_acceso"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contactos" ADD CONSTRAINT "contactos_nino_id_ninos_id_fk" FOREIGN KEY ("nino_id") REFERENCES "public"."ninos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ninos" ADD CONSTRAINT "ninos_tutor_id_tutores_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remera_nino" ADD CONSTRAINT "remera_nino_remera_id_remeras_id_fk" FOREIGN KEY ("remera_id") REFERENCES "public"."remeras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remera_nino" ADD CONSTRAINT "remera_nino_nino_id_ninos_id_fk" FOREIGN KEY ("nino_id") REFERENCES "public"."ninos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes_acceso" ADD CONSTRAINT "solicitudes_acceso_remera_id_remeras_id_fk" FOREIGN KEY ("remera_id") REFERENCES "public"."remeras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitudes_acceso" ADD CONSTRAINT "solicitudes_acceso_autorizado_por_tutores_id_fk" FOREIGN KEY ("autorizado_por") REFERENCES "public"."tutores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accesos_log_remera_idx" ON "accesos_log" USING btree ("remera_id","creado_en");--> statement-breakpoint
CREATE UNIQUE INDEX "remera_nino_unico_idx" ON "remera_nino" USING btree ("remera_id","nino_id");--> statement-breakpoint
CREATE UNIQUE INDEX "remeras_token_idx" ON "remeras" USING btree ("token");--> statement-breakpoint
CREATE INDEX "solicitudes_estado_idx" ON "solicitudes_acceso" USING btree ("estado","expira_en");--> statement-breakpoint
CREATE INDEX "solicitudes_remera_idx" ON "solicitudes_acceso" USING btree ("remera_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tutores_celular_idx" ON "tutores" USING btree ("celular");