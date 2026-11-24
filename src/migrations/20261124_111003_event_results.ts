import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Results built into events (24 Nov 2026, event pages part 2): a results report, results tables
 * with their rows, match results and prize winners, plus "has results" for the events page.
 * New tables and columns only; nothing changed or deleted. The new tables hang off "events",
 * so each row belongs to its event's club and goes when the event does.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_result_tables_columns" AS ENUM('club', 'handicap', 'rounds', 'gross', 'note');
  CREATE TYPE "public"."enum_events_result_tables_who" AS ENUM('individuals', 'pairs', 'teams');
  CREATE TYPE "public"."enum_events_result_tables_score" AS ENUM('points', 'nett', 'gross', 'toPar', 'score');
  CREATE TYPE "public"."enum_events_result_tables_rounds" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum_events_matches_winner" AS ENUM('a', 'b', 'halved');
  CREATE TABLE "events_result_tables_columns" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_events_result_tables_columns",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "events_result_tables_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"position" varchar,
  	"name" varchar,
  	"club" varchar,
  	"handicap" varchar,
  	"r1" varchar,
  	"r2" varchar,
  	"r3" varchar,
  	"r4" varchar,
  	"gross" varchar,
  	"score" varchar,
  	"note" varchar
  );
  
  CREATE TABLE "events_result_tables" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"who" "enum_events_result_tables_who" DEFAULT 'individuals' NOT NULL,
  	"score" "enum_events_result_tables_score" DEFAULT 'points' NOT NULL,
  	"note" varchar,
  	"rounds" "enum_events_result_tables_rounds" DEFAULT '2'
  );
  
  CREATE TABLE "events_matches" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"round" varchar,
  	"side_a" varchar NOT NULL,
  	"side_b" varchar NOT NULL,
  	"result" varchar,
  	"winner" "enum_events_matches_winner"
  );
  
  CREATE TABLE "events_prizes" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"prize" varchar NOT NULL,
  	"winner" varchar NOT NULL,
  	"detail" varchar
  );
  
  ALTER TABLE "events" ADD COLUMN "results_report" jsonb;
  ALTER TABLE "events" ADD COLUMN "has_results" boolean DEFAULT false;
  ALTER TABLE "events_result_tables_columns" ADD CONSTRAINT "events_result_tables_columns_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events_result_tables"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_result_tables_rows" ADD CONSTRAINT "events_result_tables_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events_result_tables"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_result_tables" ADD CONSTRAINT "events_result_tables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_matches" ADD CONSTRAINT "events_matches_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_prizes" ADD CONSTRAINT "events_prizes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_result_tables_columns_order_idx" ON "events_result_tables_columns" USING btree ("order");
  CREATE INDEX "events_result_tables_columns_parent_idx" ON "events_result_tables_columns" USING btree ("parent_id");
  CREATE INDEX "events_result_tables_rows_order_idx" ON "events_result_tables_rows" USING btree ("_order");
  CREATE INDEX "events_result_tables_rows_parent_id_idx" ON "events_result_tables_rows" USING btree ("_parent_id");
  CREATE INDEX "events_result_tables_order_idx" ON "events_result_tables" USING btree ("_order");
  CREATE INDEX "events_result_tables_parent_id_idx" ON "events_result_tables" USING btree ("_parent_id");
  CREATE INDEX "events_matches_order_idx" ON "events_matches" USING btree ("_order");
  CREATE INDEX "events_matches_parent_id_idx" ON "events_matches" USING btree ("_parent_id");
  CREATE INDEX "events_prizes_order_idx" ON "events_prizes" USING btree ("_order");
  CREATE INDEX "events_prizes_parent_id_idx" ON "events_prizes" USING btree ("_parent_id");
  CREATE INDEX "events_has_results_idx" ON "events" USING btree ("has_results");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events_result_tables_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_result_tables_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_result_tables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_matches" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_prizes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "events_result_tables_columns" CASCADE;
  DROP TABLE "events_result_tables_rows" CASCADE;
  DROP TABLE "events_result_tables" CASCADE;
  DROP TABLE "events_matches" CASCADE;
  DROP TABLE "events_prizes" CASCADE;
  DROP INDEX "events_has_results_idx";
  ALTER TABLE "events" DROP COLUMN "results_report";
  ALTER TABLE "events" DROP COLUMN "has_results";
  DROP TYPE "public"."enum_events_result_tables_columns";
  DROP TYPE "public"."enum_events_result_tables_who";
  DROP TYPE "public"."enum_events_result_tables_score";
  DROP TYPE "public"."enum_events_result_tables_rounds";
  DROP TYPE "public"."enum_events_matches_winner";`)
}
