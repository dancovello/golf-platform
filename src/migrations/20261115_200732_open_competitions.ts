import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_events_feed_entrant" AS ENUM('men', 'women', 'mixed', 'juniors', 'seniors');
  CREATE TYPE "public"."enum__pages_v_blocks_events_feed_entrant" AS ENUM('men', 'women', 'mixed', 'juniors', 'seniors');
  CREATE TYPE "public"."enum_events_entrants" AS ENUM('men', 'women', 'mixed', 'juniors', 'seniors');
  CREATE TYPE "public"."enum_events_results_type" AS ENUM('page', 'builtIn', 'url', 'document');
  CREATE TYPE "public"."enum_events_results_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  ALTER TYPE "public"."enum_events_booking" ADD VALUE 'enter' BEFORE 'enquire';
  CREATE TABLE "events_entrants" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_events_entrants",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  ALTER TABLE "pages_blocks_events_feed" ADD COLUMN "entrant" "enum_pages_blocks_events_feed_entrant";
  ALTER TABLE "_pages_v_blocks_events_feed" ADD COLUMN "entrant" "enum__pages_v_blocks_events_feed_entrant";
  ALTER TABLE "events" ADD COLUMN "eligibility" varchar;
  ALTER TABLE "events" ADD COLUMN "format" varchar;
  ALTER TABLE "events" ADD COLUMN "entries_open" timestamp(3) with time zone;
  ALTER TABLE "events" ADD COLUMN "entries_close" timestamp(3) with time zone;
  ALTER TABLE "events" ADD COLUMN "ballot" boolean DEFAULT false;
  ALTER TABLE "events" ADD COLUMN "results_type" "enum_events_results_type" DEFAULT 'page';
  ALTER TABLE "events" ADD COLUMN "results_page_id" uuid;
  ALTER TABLE "events" ADD COLUMN "results_document_id" uuid;
  ALTER TABLE "events" ADD COLUMN "results_built_in" "enum_events_results_built_in";
  ALTER TABLE "events" ADD COLUMN "results_url" varchar;
  ALTER TABLE "events_entrants" ADD CONSTRAINT "events_entrants_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_entrants_order_idx" ON "events_entrants" USING btree ("order");
  CREATE INDEX "events_entrants_parent_idx" ON "events_entrants" USING btree ("parent_id");
  ALTER TABLE "events" ADD CONSTRAINT "events_results_page_id_pages_id_fk" FOREIGN KEY ("results_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_results_document_id_documents_id_fk" FOREIGN KEY ("results_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "events_results_results_page_idx" ON "events" USING btree ("results_page_id");
  CREATE INDEX "events_results_results_document_idx" ON "events" USING btree ("results_document_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events_entrants" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "events_entrants" CASCADE;
  ALTER TABLE "events" DROP CONSTRAINT "events_results_page_id_pages_id_fk";
  
  ALTER TABLE "events" DROP CONSTRAINT "events_results_document_id_documents_id_fk";
  
  ALTER TABLE "events" ALTER COLUMN "booking" SET DATA TYPE text;
  ALTER TABLE "events" ALTER COLUMN "booking" SET DEFAULT 'book'::text;
  DROP TYPE "public"."enum_events_booking";
  CREATE TYPE "public"."enum_events_booking" AS ENUM('book', 'enquire', 'soldOut');
  ALTER TABLE "events" ALTER COLUMN "booking" SET DEFAULT 'book'::"public"."enum_events_booking";
  ALTER TABLE "events" ALTER COLUMN "booking" SET DATA TYPE "public"."enum_events_booking" USING "booking"::"public"."enum_events_booking";
  DROP INDEX "events_results_results_page_idx";
  DROP INDEX "events_results_results_document_idx";
  ALTER TABLE "pages_blocks_events_feed" DROP COLUMN "entrant";
  ALTER TABLE "_pages_v_blocks_events_feed" DROP COLUMN "entrant";
  ALTER TABLE "events" DROP COLUMN "eligibility";
  ALTER TABLE "events" DROP COLUMN "format";
  ALTER TABLE "events" DROP COLUMN "entries_open";
  ALTER TABLE "events" DROP COLUMN "entries_close";
  ALTER TABLE "events" DROP COLUMN "ballot";
  ALTER TABLE "events" DROP COLUMN "results_type";
  ALTER TABLE "events" DROP COLUMN "results_page_id";
  ALTER TABLE "events" DROP COLUMN "results_document_id";
  ALTER TABLE "events" DROP COLUMN "results_built_in";
  ALTER TABLE "events" DROP COLUMN "results_url";
  DROP TYPE "public"."enum_pages_blocks_events_feed_entrant";
  DROP TYPE "public"."enum__pages_v_blocks_events_feed_entrant";
  DROP TYPE "public"."enum_events_entrants";
  DROP TYPE "public"."enum_events_results_type";
  DROP TYPE "public"."enum_events_results_built_in";`)
}
