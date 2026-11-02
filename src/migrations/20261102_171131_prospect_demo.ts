import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tenants" ADD COLUMN "demo_enabled" boolean DEFAULT false;
  ALTER TABLE "tenants" ADD COLUMN "demo_token" varchar;
  ALTER TABLE "tenants" ADD COLUMN "demo_expires_at" timestamp(3) with time zone;
  CREATE INDEX "tenants_demo_enabled_idx" ON "tenants" USING btree ("demo_enabled");
  CREATE UNIQUE INDEX "tenants_demo_token_idx" ON "tenants" USING btree ("demo_token");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "tenants_demo_enabled_idx";
  DROP INDEX "tenants_demo_token_idx";
  ALTER TABLE "tenants" DROP COLUMN "demo_enabled";
  ALTER TABLE "tenants" DROP COLUMN "demo_token";
  ALTER TABLE "tenants" DROP COLUMN "demo_expires_at";`)
}
