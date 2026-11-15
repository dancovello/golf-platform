import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_visitor_times_timetables_start_month" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum_pages_blocks_visitor_times_timetables_end_month" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum_pages_blocks_visitor_times_style" AS ENUM('table');
  CREATE TYPE "public"."enum__pages_v_blocks_visitor_times_timetables_start_month" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum__pages_v_blocks_visitor_times_timetables_end_month" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum__pages_v_blocks_visitor_times_style" AS ENUM('table');
  CREATE TYPE "public"."enum_course_status_notices_kind" AS ENUM('closed', 'restricted', 'open');
  CREATE TABLE "pages_blocks_visitor_times_timetables_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"days" varchar,
  	"times" varchar,
  	"note" varchar
  );
  
  CREATE TABLE "pages_blocks_visitor_times_timetables" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"start_month" "enum_pages_blocks_visitor_times_timetables_start_month",
  	"end_month" "enum_pages_blocks_visitor_times_timetables_end_month"
  );
  
  CREATE TABLE "pages_blocks_visitor_times" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_visitor_times_style" DEFAULT 'table',
  	"eyebrow" varchar,
  	"heading" varchar DEFAULT 'When visitors can play',
  	"intro" varchar,
  	"footnote" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_visitor_times_timetables_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"days" varchar,
  	"times" varchar,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_visitor_times_timetables" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"start_month" "enum__pages_v_blocks_visitor_times_timetables_start_month",
  	"end_month" "enum__pages_v_blocks_visitor_times_timetables_end_month",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_visitor_times" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"style" "enum__pages_v_blocks_visitor_times_style" DEFAULT 'table',
  	"eyebrow" varchar,
  	"heading" varchar DEFAULT 'When visitors can play',
  	"intro" varchar,
  	"footnote" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "course_status_notices" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"message" varchar NOT NULL,
  	"kind" "enum_course_status_notices_kind" DEFAULT 'restricted' NOT NULL,
  	"starts_on" timestamp(3) with time zone NOT NULL,
  	"ends_on" timestamp(3) with time zone
  );
  
  ALTER TABLE "course_status" ADD COLUMN "state_changed_at" timestamp(3) with time zone;
  ALTER TABLE "pages_blocks_visitor_times_timetables_rows" ADD CONSTRAINT "pages_blocks_visitor_times_timetables_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_visitor_times_timetables"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_visitor_times_timetables" ADD CONSTRAINT "pages_blocks_visitor_times_timetables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_visitor_times"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_visitor_times" ADD CONSTRAINT "pages_blocks_visitor_times_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_visitor_times_timetables_rows" ADD CONSTRAINT "_pages_v_blocks_visitor_times_timetables_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_visitor_times_timetables"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_visitor_times_timetables" ADD CONSTRAINT "_pages_v_blocks_visitor_times_timetables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_visitor_times"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_visitor_times" ADD CONSTRAINT "_pages_v_blocks_visitor_times_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "course_status_notices" ADD CONSTRAINT "course_status_notices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."course_status"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_visitor_times_timetables_rows_order_idx" ON "pages_blocks_visitor_times_timetables_rows" USING btree ("_order");
  CREATE INDEX "pages_blocks_visitor_times_timetables_rows_parent_id_idx" ON "pages_blocks_visitor_times_timetables_rows" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_visitor_times_timetables_order_idx" ON "pages_blocks_visitor_times_timetables" USING btree ("_order");
  CREATE INDEX "pages_blocks_visitor_times_timetables_parent_id_idx" ON "pages_blocks_visitor_times_timetables" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_visitor_times_order_idx" ON "pages_blocks_visitor_times" USING btree ("_order");
  CREATE INDEX "pages_blocks_visitor_times_parent_id_idx" ON "pages_blocks_visitor_times" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_visitor_times_path_idx" ON "pages_blocks_visitor_times" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_visitor_times_timetables_rows_order_idx" ON "_pages_v_blocks_visitor_times_timetables_rows" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_visitor_times_timetables_rows_parent_id_idx" ON "_pages_v_blocks_visitor_times_timetables_rows" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_visitor_times_timetables_order_idx" ON "_pages_v_blocks_visitor_times_timetables" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_visitor_times_timetables_parent_id_idx" ON "_pages_v_blocks_visitor_times_timetables" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_visitor_times_order_idx" ON "_pages_v_blocks_visitor_times" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_visitor_times_parent_id_idx" ON "_pages_v_blocks_visitor_times" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_visitor_times_path_idx" ON "_pages_v_blocks_visitor_times" USING btree ("_path");
  CREATE INDEX "course_status_notices_order_idx" ON "course_status_notices" USING btree ("_order");
  CREATE INDEX "course_status_notices_parent_id_idx" ON "course_status_notices" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_visitor_times_timetables_rows" CASCADE;
  DROP TABLE "pages_blocks_visitor_times_timetables" CASCADE;
  DROP TABLE "pages_blocks_visitor_times" CASCADE;
  DROP TABLE "_pages_v_blocks_visitor_times_timetables_rows" CASCADE;
  DROP TABLE "_pages_v_blocks_visitor_times_timetables" CASCADE;
  DROP TABLE "_pages_v_blocks_visitor_times" CASCADE;
  DROP TABLE "course_status_notices" CASCADE;
  ALTER TABLE "course_status" DROP COLUMN "state_changed_at";
  DROP TYPE "public"."enum_pages_blocks_visitor_times_timetables_start_month";
  DROP TYPE "public"."enum_pages_blocks_visitor_times_timetables_end_month";
  DROP TYPE "public"."enum_pages_blocks_visitor_times_style";
  DROP TYPE "public"."enum__pages_v_blocks_visitor_times_timetables_start_month";
  DROP TYPE "public"."enum__pages_v_blocks_visitor_times_timetables_end_month";
  DROP TYPE "public"."enum__pages_v_blocks_visitor_times_style";
  DROP TYPE "public"."enum_course_status_notices_kind";`)
}
