import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_mk_week_moments_preview" AS ENUM('courseStatus', 'news', 'greenFees', 'holeGuide');
  CREATE TYPE "public"."enum__mk_week_v_moments_preview" AS ENUM('courseStatus', 'news', 'greenFees', 'holeGuide');
  CREATE TABLE "mk_home_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"subhead" varchar,
  	"primary_label" varchar DEFAULT 'Book a demo',
  	"primary_href" varchar DEFAULT '/book-a-demo',
  	"secondary_label" varchar DEFAULT 'Get your free homepage',
  	"secondary_href" varchar DEFAULT '/switching',
  	"proof_line" varchar,
  	"note" varchar,
  	"note_strong" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_stats_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"claim" varchar,
  	"source" varchar,
  	"method_href" varchar
  );
  
  CREATE TABLE "mk_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_compare_good_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "mk_compare_poor_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "mk_compare" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"good_label" varchar,
  	"good_title" varchar,
  	"poor_label" varchar,
  	"poor_title" varchar,
  	"footnotes" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_edit_live" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"headline" varchar DEFAULT 'Spring open week starts Saturday',
  	"toggle_label" varchar DEFAULT 'Show visitor tee times button',
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_week_moments" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"time" varchar,
  	"preview" "enum_mk_week_moments_preview",
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "mk_week" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_moves_found" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"count" varchar
  );
  
  CREATE TABLE "mk_moves_built" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "mk_moves_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "mk_moves" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"chip" varchar DEFAULT 'Copied across with AI',
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_founder" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_home_hero_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"subhead" varchar,
  	"primary_label" varchar DEFAULT 'Book a demo',
  	"primary_href" varchar DEFAULT '/book-a-demo',
  	"secondary_label" varchar DEFAULT 'Get your free homepage',
  	"secondary_href" varchar DEFAULT '/switching',
  	"proof_line" varchar,
  	"note" varchar,
  	"note_strong" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_stats_v_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"number" varchar,
  	"claim" varchar,
  	"source" varchar,
  	"method_href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_stats_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_compare_v_good_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_compare_v_poor_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_compare_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"good_label" varchar,
  	"good_title" varchar,
  	"poor_label" varchar,
  	"poor_title" varchar,
  	"footnotes" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_edit_live_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"headline" varchar DEFAULT 'Spring open week starts Saturday',
  	"toggle_label" varchar DEFAULT 'Show visitor tee times button',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_week_v_moments" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"time" varchar,
  	"preview" "enum__mk_week_v_moments_preview",
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_week_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_moves_v_found" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"count" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_moves_v_built" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_moves_v_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_moves_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"chip" varchar DEFAULT 'Copied across with AI',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_founder_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "mk_home_hero" ADD CONSTRAINT "mk_home_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_stats_stats" ADD CONSTRAINT "mk_stats_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_stats" ADD CONSTRAINT "mk_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_compare_good_points" ADD CONSTRAINT "mk_compare_good_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_compare_poor_points" ADD CONSTRAINT "mk_compare_poor_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_compare" ADD CONSTRAINT "mk_compare_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_edit_live" ADD CONSTRAINT "mk_edit_live_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_week_moments" ADD CONSTRAINT "mk_week_moments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_week"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_week" ADD CONSTRAINT "mk_week_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_moves_found" ADD CONSTRAINT "mk_moves_found_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_moves"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_moves_built" ADD CONSTRAINT "mk_moves_built_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_moves"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_moves_steps" ADD CONSTRAINT "mk_moves_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_moves"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_moves" ADD CONSTRAINT "mk_moves_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_founder" ADD CONSTRAINT "mk_founder_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_home_hero_v" ADD CONSTRAINT "_mk_home_hero_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_stats_v_stats" ADD CONSTRAINT "_mk_stats_v_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_stats_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_stats_v" ADD CONSTRAINT "_mk_stats_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_compare_v_good_points" ADD CONSTRAINT "_mk_compare_v_good_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_compare_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_compare_v_poor_points" ADD CONSTRAINT "_mk_compare_v_poor_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_compare_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_compare_v" ADD CONSTRAINT "_mk_compare_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_edit_live_v" ADD CONSTRAINT "_mk_edit_live_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_week_v_moments" ADD CONSTRAINT "_mk_week_v_moments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_week_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_week_v" ADD CONSTRAINT "_mk_week_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_moves_v_found" ADD CONSTRAINT "_mk_moves_v_found_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_moves_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_moves_v_built" ADD CONSTRAINT "_mk_moves_v_built_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_moves_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_moves_v_steps" ADD CONSTRAINT "_mk_moves_v_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_moves_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_moves_v" ADD CONSTRAINT "_mk_moves_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_founder_v" ADD CONSTRAINT "_mk_founder_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "mk_home_hero_order_idx" ON "mk_home_hero" USING btree ("_order");
  CREATE INDEX "mk_home_hero_parent_id_idx" ON "mk_home_hero" USING btree ("_parent_id");
  CREATE INDEX "mk_home_hero_path_idx" ON "mk_home_hero" USING btree ("_path");
  CREATE INDEX "mk_stats_stats_order_idx" ON "mk_stats_stats" USING btree ("_order");
  CREATE INDEX "mk_stats_stats_parent_id_idx" ON "mk_stats_stats" USING btree ("_parent_id");
  CREATE INDEX "mk_stats_order_idx" ON "mk_stats" USING btree ("_order");
  CREATE INDEX "mk_stats_parent_id_idx" ON "mk_stats" USING btree ("_parent_id");
  CREATE INDEX "mk_stats_path_idx" ON "mk_stats" USING btree ("_path");
  CREATE INDEX "mk_compare_good_points_order_idx" ON "mk_compare_good_points" USING btree ("_order");
  CREATE INDEX "mk_compare_good_points_parent_id_idx" ON "mk_compare_good_points" USING btree ("_parent_id");
  CREATE INDEX "mk_compare_poor_points_order_idx" ON "mk_compare_poor_points" USING btree ("_order");
  CREATE INDEX "mk_compare_poor_points_parent_id_idx" ON "mk_compare_poor_points" USING btree ("_parent_id");
  CREATE INDEX "mk_compare_order_idx" ON "mk_compare" USING btree ("_order");
  CREATE INDEX "mk_compare_parent_id_idx" ON "mk_compare" USING btree ("_parent_id");
  CREATE INDEX "mk_compare_path_idx" ON "mk_compare" USING btree ("_path");
  CREATE INDEX "mk_edit_live_order_idx" ON "mk_edit_live" USING btree ("_order");
  CREATE INDEX "mk_edit_live_parent_id_idx" ON "mk_edit_live" USING btree ("_parent_id");
  CREATE INDEX "mk_edit_live_path_idx" ON "mk_edit_live" USING btree ("_path");
  CREATE INDEX "mk_week_moments_order_idx" ON "mk_week_moments" USING btree ("_order");
  CREATE INDEX "mk_week_moments_parent_id_idx" ON "mk_week_moments" USING btree ("_parent_id");
  CREATE INDEX "mk_week_order_idx" ON "mk_week" USING btree ("_order");
  CREATE INDEX "mk_week_parent_id_idx" ON "mk_week" USING btree ("_parent_id");
  CREATE INDEX "mk_week_path_idx" ON "mk_week" USING btree ("_path");
  CREATE INDEX "mk_moves_found_order_idx" ON "mk_moves_found" USING btree ("_order");
  CREATE INDEX "mk_moves_found_parent_id_idx" ON "mk_moves_found" USING btree ("_parent_id");
  CREATE INDEX "mk_moves_built_order_idx" ON "mk_moves_built" USING btree ("_order");
  CREATE INDEX "mk_moves_built_parent_id_idx" ON "mk_moves_built" USING btree ("_parent_id");
  CREATE INDEX "mk_moves_steps_order_idx" ON "mk_moves_steps" USING btree ("_order");
  CREATE INDEX "mk_moves_steps_parent_id_idx" ON "mk_moves_steps" USING btree ("_parent_id");
  CREATE INDEX "mk_moves_order_idx" ON "mk_moves" USING btree ("_order");
  CREATE INDEX "mk_moves_parent_id_idx" ON "mk_moves" USING btree ("_parent_id");
  CREATE INDEX "mk_moves_path_idx" ON "mk_moves" USING btree ("_path");
  CREATE INDEX "mk_founder_order_idx" ON "mk_founder" USING btree ("_order");
  CREATE INDEX "mk_founder_parent_id_idx" ON "mk_founder" USING btree ("_parent_id");
  CREATE INDEX "mk_founder_path_idx" ON "mk_founder" USING btree ("_path");
  CREATE INDEX "_mk_home_hero_v_order_idx" ON "_mk_home_hero_v" USING btree ("_order");
  CREATE INDEX "_mk_home_hero_v_parent_id_idx" ON "_mk_home_hero_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_home_hero_v_path_idx" ON "_mk_home_hero_v" USING btree ("_path");
  CREATE INDEX "_mk_stats_v_stats_order_idx" ON "_mk_stats_v_stats" USING btree ("_order");
  CREATE INDEX "_mk_stats_v_stats_parent_id_idx" ON "_mk_stats_v_stats" USING btree ("_parent_id");
  CREATE INDEX "_mk_stats_v_order_idx" ON "_mk_stats_v" USING btree ("_order");
  CREATE INDEX "_mk_stats_v_parent_id_idx" ON "_mk_stats_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_stats_v_path_idx" ON "_mk_stats_v" USING btree ("_path");
  CREATE INDEX "_mk_compare_v_good_points_order_idx" ON "_mk_compare_v_good_points" USING btree ("_order");
  CREATE INDEX "_mk_compare_v_good_points_parent_id_idx" ON "_mk_compare_v_good_points" USING btree ("_parent_id");
  CREATE INDEX "_mk_compare_v_poor_points_order_idx" ON "_mk_compare_v_poor_points" USING btree ("_order");
  CREATE INDEX "_mk_compare_v_poor_points_parent_id_idx" ON "_mk_compare_v_poor_points" USING btree ("_parent_id");
  CREATE INDEX "_mk_compare_v_order_idx" ON "_mk_compare_v" USING btree ("_order");
  CREATE INDEX "_mk_compare_v_parent_id_idx" ON "_mk_compare_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_compare_v_path_idx" ON "_mk_compare_v" USING btree ("_path");
  CREATE INDEX "_mk_edit_live_v_order_idx" ON "_mk_edit_live_v" USING btree ("_order");
  CREATE INDEX "_mk_edit_live_v_parent_id_idx" ON "_mk_edit_live_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_edit_live_v_path_idx" ON "_mk_edit_live_v" USING btree ("_path");
  CREATE INDEX "_mk_week_v_moments_order_idx" ON "_mk_week_v_moments" USING btree ("_order");
  CREATE INDEX "_mk_week_v_moments_parent_id_idx" ON "_mk_week_v_moments" USING btree ("_parent_id");
  CREATE INDEX "_mk_week_v_order_idx" ON "_mk_week_v" USING btree ("_order");
  CREATE INDEX "_mk_week_v_parent_id_idx" ON "_mk_week_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_week_v_path_idx" ON "_mk_week_v" USING btree ("_path");
  CREATE INDEX "_mk_moves_v_found_order_idx" ON "_mk_moves_v_found" USING btree ("_order");
  CREATE INDEX "_mk_moves_v_found_parent_id_idx" ON "_mk_moves_v_found" USING btree ("_parent_id");
  CREATE INDEX "_mk_moves_v_built_order_idx" ON "_mk_moves_v_built" USING btree ("_order");
  CREATE INDEX "_mk_moves_v_built_parent_id_idx" ON "_mk_moves_v_built" USING btree ("_parent_id");
  CREATE INDEX "_mk_moves_v_steps_order_idx" ON "_mk_moves_v_steps" USING btree ("_order");
  CREATE INDEX "_mk_moves_v_steps_parent_id_idx" ON "_mk_moves_v_steps" USING btree ("_parent_id");
  CREATE INDEX "_mk_moves_v_order_idx" ON "_mk_moves_v" USING btree ("_order");
  CREATE INDEX "_mk_moves_v_parent_id_idx" ON "_mk_moves_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_moves_v_path_idx" ON "_mk_moves_v" USING btree ("_path");
  CREATE INDEX "_mk_founder_v_order_idx" ON "_mk_founder_v" USING btree ("_order");
  CREATE INDEX "_mk_founder_v_parent_id_idx" ON "_mk_founder_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_founder_v_path_idx" ON "_mk_founder_v" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "mk_home_hero" CASCADE;
  DROP TABLE "mk_stats_stats" CASCADE;
  DROP TABLE "mk_stats" CASCADE;
  DROP TABLE "mk_compare_good_points" CASCADE;
  DROP TABLE "mk_compare_poor_points" CASCADE;
  DROP TABLE "mk_compare" CASCADE;
  DROP TABLE "mk_edit_live" CASCADE;
  DROP TABLE "mk_week_moments" CASCADE;
  DROP TABLE "mk_week" CASCADE;
  DROP TABLE "mk_moves_found" CASCADE;
  DROP TABLE "mk_moves_built" CASCADE;
  DROP TABLE "mk_moves_steps" CASCADE;
  DROP TABLE "mk_moves" CASCADE;
  DROP TABLE "mk_founder" CASCADE;
  DROP TABLE "_mk_home_hero_v" CASCADE;
  DROP TABLE "_mk_stats_v_stats" CASCADE;
  DROP TABLE "_mk_stats_v" CASCADE;
  DROP TABLE "_mk_compare_v_good_points" CASCADE;
  DROP TABLE "_mk_compare_v_poor_points" CASCADE;
  DROP TABLE "_mk_compare_v" CASCADE;
  DROP TABLE "_mk_edit_live_v" CASCADE;
  DROP TABLE "_mk_week_v_moments" CASCADE;
  DROP TABLE "_mk_week_v" CASCADE;
  DROP TABLE "_mk_moves_v_found" CASCADE;
  DROP TABLE "_mk_moves_v_built" CASCADE;
  DROP TABLE "_mk_moves_v_steps" CASCADE;
  DROP TABLE "_mk_moves_v" CASCADE;
  DROP TABLE "_mk_founder_v" CASCADE;
  DROP TYPE "public"."enum_mk_week_moments_preview";
  DROP TYPE "public"."enum__mk_week_v_moments_preview";`)
}
