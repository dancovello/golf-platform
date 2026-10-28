import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Shared rate-limit counts (src/security/rateLimit.ts): one new table, nothing else changed.
 * Holds hashed visitor keys only, never addresses. The website's golf_app account gets read and
 * write on it through the default grants (20261011_173431_app_role_grants).
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "rate_limits" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar(96) NOT NULL,
  	"window_start" timestamp with time zone NOT NULL,
  	"count" integer DEFAULT 0 NOT NULL
  );
  
  CREATE UNIQUE INDEX "rate_limits_key_window_idx" ON "rate_limits" USING btree ("key","window_start");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "rate_limits" CASCADE;`)
}
