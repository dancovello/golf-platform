import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "agreement_acceptances" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"full_name" varchar NOT NULL,
  	"job_title" varchar NOT NULL,
  	"authorised" boolean DEFAULT false NOT NULL,
  	"version" varchar,
  	"accepted_by_id" uuid,
  	"accepted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "agreement_acceptances" ADD CONSTRAINT "agreement_acceptances_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "agreement_acceptances" ADD CONSTRAINT "agreement_acceptances_accepted_by_id_users_id_fk" FOREIGN KEY ("accepted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "agreement_acceptances_tenant_idx" ON "agreement_acceptances" USING btree ("tenant_id");
  CREATE INDEX "agreement_acceptances_accepted_by_idx" ON "agreement_acceptances" USING btree ("accepted_by_id");
  CREATE INDEX "agreement_acceptances_updated_at_idx" ON "agreement_acceptances" USING btree ("updated_at");
  CREATE INDEX "agreement_acceptances_created_at_idx" ON "agreement_acceptances" USING btree ("created_at");
  REVOKE UPDATE, DELETE ON "agreement_acceptances" FROM golf_app;`)

  // Hand-edited above: tenant_id NOT NULL and ON DELETE restrict (every record belongs to a
  // club, and a club with a record can't be deleted), and the website's golf_app account can
  // only add records, never change or delete them: they stand as evidence of acceptance.
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "agreement_acceptances" CASCADE;`)
}
