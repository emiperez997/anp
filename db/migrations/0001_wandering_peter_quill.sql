ALTER TABLE "tutores" ALTER COLUMN "celular" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tutores" ADD COLUMN "email" varchar(255);--> statement-breakpoint
CREATE UNIQUE INDEX "tutores_email_idx" ON "tutores" USING btree ("email");