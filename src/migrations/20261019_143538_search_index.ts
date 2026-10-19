import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Site search (src/search): the index and each club's change count, plus pg_trgm for spelling
 * tolerance. pg_trgm is a "trusted" extension, so the owner account can add it on Neon.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE EXTENSION IF NOT EXISTS pg_trgm;

   CREATE TABLE "search_entries" (
  	"tenant_id" uuid NOT NULL,
  	"kind" varchar(16) NOT NULL,
  	"source_id" uuid NOT NULL,
  	"title" text NOT NULL,
  	"eyebrow" text,
  	"excerpt" text,
  	"body" text,
  	"link" jsonb NOT NULL,
  	"details" jsonb,
  	"date" timestamp with time zone,
  	"visible_from" timestamp with time zone,
  	"visible_until" timestamp with time zone,
  	"search" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce("title", '')), 'A') || setweight(to_tsvector('english', coalesce("eyebrow", '') || ' ' || coalesce("excerpt", '')), 'B') || setweight(to_tsvector('english', coalesce("body", '')), 'C')) STORED,
  	CONSTRAINT "search_entries_pkey" PRIMARY KEY("tenant_id","kind","source_id")
  );
  
  CREATE TABLE "search_state" (
  	"tenant_id" uuid PRIMARY KEY NOT NULL,
  	"changes" integer DEFAULT 0 NOT NULL,
  	"built_changes" integer DEFAULT -1 NOT NULL,
  	"version" integer DEFAULT 0 NOT NULL,
  	"built_at" timestamp with time zone
  );
  
  ALTER TABLE "search_entries" ADD CONSTRAINT "search_entries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_state" ADD CONSTRAINT "search_state_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "search_entries_search_idx" ON "search_entries" USING gin ("search");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "search_entries" CASCADE;
  DROP TABLE "search_state" CASCADE;`)
}
