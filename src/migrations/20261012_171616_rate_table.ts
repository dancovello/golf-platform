import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_rate_table_tabs_sections_start_month" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum_pages_blocks_rate_table_tabs_sections_end_month" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum_pages_blocks_rate_table_style" AS ENUM('classic', 'seasons', 'matrix');
  CREATE TYPE "public"."enum_pages_blocks_rate_table_button_type" AS ENUM('page', 'url');
  CREATE TABLE "pages_blocks_rate_table_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "pages_blocks_rate_table_tabs_sections_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"sub_label" varchar,
  	"price1" varchar,
  	"price2" varchar,
  	"price3" varchar,
  	"price4" varchar
  );
  
  CREATE TABLE "pages_blocks_rate_table_tabs_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"period" varchar,
  	"start_month" "enum_pages_blocks_rate_table_tabs_sections_start_month",
  	"end_month" "enum_pages_blocks_rate_table_tabs_sections_end_month",
  	"note" varchar
  );
  
  CREATE TABLE "pages_blocks_rate_table_tabs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_rate_table_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_rate_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_rate_table_style" DEFAULT 'classic' NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar NOT NULL,
  	"intro" varchar,
  	"footnote" varchar,
  	"button_label" varchar,
  	"button_type" "enum_pages_blocks_rate_table_button_type" DEFAULT 'page',
  	"button_page_id" uuid,
  	"button_url" varchar,
  	"aside_eyebrow" varchar,
  	"aside_heading" varchar,
  	"show_phone" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_rate_table_columns" ADD CONSTRAINT "pages_blocks_rate_table_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_rate_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rate_table_tabs_sections_rows" ADD CONSTRAINT "pages_blocks_rate_table_tabs_sections_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_rate_table_tabs_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rate_table_tabs_sections" ADD CONSTRAINT "pages_blocks_rate_table_tabs_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_rate_table_tabs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rate_table_tabs" ADD CONSTRAINT "pages_blocks_rate_table_tabs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_rate_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rate_table_included" ADD CONSTRAINT "pages_blocks_rate_table_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_rate_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rate_table" ADD CONSTRAINT "pages_blocks_rate_table_button_page_id_pages_id_fk" FOREIGN KEY ("button_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_rate_table" ADD CONSTRAINT "pages_blocks_rate_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_rate_table_columns_order_idx" ON "pages_blocks_rate_table_columns" USING btree ("_order");
  CREATE INDEX "pages_blocks_rate_table_columns_parent_id_idx" ON "pages_blocks_rate_table_columns" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rate_table_tabs_sections_rows_order_idx" ON "pages_blocks_rate_table_tabs_sections_rows" USING btree ("_order");
  CREATE INDEX "pages_blocks_rate_table_tabs_sections_rows_parent_id_idx" ON "pages_blocks_rate_table_tabs_sections_rows" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rate_table_tabs_sections_order_idx" ON "pages_blocks_rate_table_tabs_sections" USING btree ("_order");
  CREATE INDEX "pages_blocks_rate_table_tabs_sections_parent_id_idx" ON "pages_blocks_rate_table_tabs_sections" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rate_table_tabs_order_idx" ON "pages_blocks_rate_table_tabs" USING btree ("_order");
  CREATE INDEX "pages_blocks_rate_table_tabs_parent_id_idx" ON "pages_blocks_rate_table_tabs" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rate_table_included_order_idx" ON "pages_blocks_rate_table_included" USING btree ("_order");
  CREATE INDEX "pages_blocks_rate_table_included_parent_id_idx" ON "pages_blocks_rate_table_included" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rate_table_order_idx" ON "pages_blocks_rate_table" USING btree ("_order");
  CREATE INDEX "pages_blocks_rate_table_parent_id_idx" ON "pages_blocks_rate_table" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rate_table_path_idx" ON "pages_blocks_rate_table" USING btree ("_path");
  CREATE INDEX "pages_blocks_rate_table_button_button_page_idx" ON "pages_blocks_rate_table" USING btree ("button_page_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_rate_table_columns" CASCADE;
  DROP TABLE "pages_blocks_rate_table_tabs_sections_rows" CASCADE;
  DROP TABLE "pages_blocks_rate_table_tabs_sections" CASCADE;
  DROP TABLE "pages_blocks_rate_table_tabs" CASCADE;
  DROP TABLE "pages_blocks_rate_table_included" CASCADE;
  DROP TABLE "pages_blocks_rate_table" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_rate_table_tabs_sections_start_month";
  DROP TYPE "public"."enum_pages_blocks_rate_table_tabs_sections_end_month";
  DROP TYPE "public"."enum_pages_blocks_rate_table_style";
  DROP TYPE "public"."enum_pages_blocks_rate_table_button_type";`)
}
