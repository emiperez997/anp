ALTER TYPE "public"."tipo_acceso_log" ADD VALUE 'escaneo_ubicacion';--> statement-breakpoint
ALTER TABLE "accesos_log" ADD COLUMN "ubicacion_lat" double precision;--> statement-breakpoint
ALTER TABLE "accesos_log" ADD COLUMN "ubicacion_lng" double precision;--> statement-breakpoint
ALTER TABLE "accesos_log" ADD COLUMN "ubicacion_precision_m" real;--> statement-breakpoint
ALTER TABLE "accesos_log" ADD COLUMN "ubicacion_capturada_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "accesos_log" ADD COLUMN "cliente_id" varchar(64);--> statement-breakpoint
ALTER TABLE "solicitudes_acceso" ADD COLUMN "ubicacion_lat" double precision;--> statement-breakpoint
ALTER TABLE "solicitudes_acceso" ADD COLUMN "ubicacion_lng" double precision;--> statement-breakpoint
ALTER TABLE "solicitudes_acceso" ADD COLUMN "ubicacion_precision_m" real;--> statement-breakpoint
ALTER TABLE "solicitudes_acceso" ADD COLUMN "ubicacion_capturada_en" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "accesos_log_ubicacion_capturada_idx" ON "accesos_log" USING btree ("ubicacion_capturada_en") WHERE "accesos_log"."ubicacion_capturada_en" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "accesos_log_cliente_idx" ON "accesos_log" USING btree ("remera_id","cliente_id","creado_en");--> statement-breakpoint
CREATE INDEX "solicitudes_ubicacion_capturada_idx" ON "solicitudes_acceso" USING btree ("ubicacion_capturada_en") WHERE "solicitudes_acceso"."ubicacion_capturada_en" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "accesos_log" ADD CONSTRAINT "accesos_log_ubicacion_valida" CHECK (("accesos_log"."ubicacion_lat" IS NULL AND "accesos_log"."ubicacion_lng" IS NULL) OR ("accesos_log"."ubicacion_lat" IS NOT NULL AND "accesos_log"."ubicacion_lng" IS NOT NULL AND "accesos_log"."ubicacion_lat" BETWEEN -90 AND 90 AND "accesos_log"."ubicacion_lng" BETWEEN -180 AND 180));--> statement-breakpoint
ALTER TABLE "solicitudes_acceso" ADD CONSTRAINT "solicitudes_ubicacion_valida" CHECK (("solicitudes_acceso"."ubicacion_lat" IS NULL AND "solicitudes_acceso"."ubicacion_lng" IS NULL) OR ("solicitudes_acceso"."ubicacion_lat" IS NOT NULL AND "solicitudes_acceso"."ubicacion_lng" IS NOT NULL AND "solicitudes_acceso"."ubicacion_lat" BETWEEN -90 AND 90 AND "solicitudes_acceso"."ubicacion_lng" BETWEEN -180 AND 180));