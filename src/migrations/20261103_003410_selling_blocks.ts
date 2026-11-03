import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_mk_roles_roles_visual" AS ENUM('courseStatus', 'events', 'search', 'greenFees');
  CREATE TYPE "public"."enum__mk_roles_v_roles_visual" AS ENUM('courseStatus', 'events', 'search', 'greenFees');
  CREATE TABLE "mk_assurance_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "mk_assurance" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_compare_rows_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"old_way" varchar,
  	"our_way" varchar
  );
  
  CREATE TABLE "mk_compare_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"old_label" varchar DEFAULT 'How it usually goes',
  	"our_label" varchar DEFAULT 'With us',
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "mk_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_objections_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"topic" varchar,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "mk_objections" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_roles_roles_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "mk_roles_roles" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tab" varchar,
  	"eyebrow" varchar,
  	"headline" varchar,
  	"visual" "enum_mk_roles_roles_visual" DEFAULT 'courseStatus'
  );
  
  CREATE TABLE "mk_roles" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_assurance_v_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_assurance_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_compare_rows_v_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"old_way" varchar,
  	"our_way" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_compare_rows_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"old_label" varchar DEFAULT 'How it usually goes',
  	"our_label" varchar DEFAULT 'With us',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_steps_v_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_steps_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_objections_v_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"topic" varchar,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_objections_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_roles_v_roles_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_roles_v_roles" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tab" varchar,
  	"eyebrow" varchar,
  	"headline" varchar,
  	"visual" "enum__mk_roles_v_roles_visual" DEFAULT 'courseStatus',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_roles_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "mk_assurance_items" ADD CONSTRAINT "mk_assurance_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_assurance"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_assurance" ADD CONSTRAINT "mk_assurance_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_compare_rows_rows" ADD CONSTRAINT "mk_compare_rows_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_compare_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_compare_rows" ADD CONSTRAINT "mk_compare_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_steps_steps" ADD CONSTRAINT "mk_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_steps" ADD CONSTRAINT "mk_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_objections_items" ADD CONSTRAINT "mk_objections_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_objections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_objections" ADD CONSTRAINT "mk_objections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_roles_roles_points" ADD CONSTRAINT "mk_roles_roles_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_roles_roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_roles_roles" ADD CONSTRAINT "mk_roles_roles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_roles" ADD CONSTRAINT "mk_roles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_assurance_v_items" ADD CONSTRAINT "_mk_assurance_v_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_assurance_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_assurance_v" ADD CONSTRAINT "_mk_assurance_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_compare_rows_v_rows" ADD CONSTRAINT "_mk_compare_rows_v_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_compare_rows_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_compare_rows_v" ADD CONSTRAINT "_mk_compare_rows_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_steps_v_steps" ADD CONSTRAINT "_mk_steps_v_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_steps_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_steps_v" ADD CONSTRAINT "_mk_steps_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_objections_v_items" ADD CONSTRAINT "_mk_objections_v_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_objections_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_objections_v" ADD CONSTRAINT "_mk_objections_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_roles_v_roles_points" ADD CONSTRAINT "_mk_roles_v_roles_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_roles_v_roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_roles_v_roles" ADD CONSTRAINT "_mk_roles_v_roles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_roles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_roles_v" ADD CONSTRAINT "_mk_roles_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "mk_assurance_items_order_idx" ON "mk_assurance_items" USING btree ("_order");
  CREATE INDEX "mk_assurance_items_parent_id_idx" ON "mk_assurance_items" USING btree ("_parent_id");
  CREATE INDEX "mk_assurance_order_idx" ON "mk_assurance" USING btree ("_order");
  CREATE INDEX "mk_assurance_parent_id_idx" ON "mk_assurance" USING btree ("_parent_id");
  CREATE INDEX "mk_assurance_path_idx" ON "mk_assurance" USING btree ("_path");
  CREATE INDEX "mk_compare_rows_rows_order_idx" ON "mk_compare_rows_rows" USING btree ("_order");
  CREATE INDEX "mk_compare_rows_rows_parent_id_idx" ON "mk_compare_rows_rows" USING btree ("_parent_id");
  CREATE INDEX "mk_compare_rows_order_idx" ON "mk_compare_rows" USING btree ("_order");
  CREATE INDEX "mk_compare_rows_parent_id_idx" ON "mk_compare_rows" USING btree ("_parent_id");
  CREATE INDEX "mk_compare_rows_path_idx" ON "mk_compare_rows" USING btree ("_path");
  CREATE INDEX "mk_steps_steps_order_idx" ON "mk_steps_steps" USING btree ("_order");
  CREATE INDEX "mk_steps_steps_parent_id_idx" ON "mk_steps_steps" USING btree ("_parent_id");
  CREATE INDEX "mk_steps_order_idx" ON "mk_steps" USING btree ("_order");
  CREATE INDEX "mk_steps_parent_id_idx" ON "mk_steps" USING btree ("_parent_id");
  CREATE INDEX "mk_steps_path_idx" ON "mk_steps" USING btree ("_path");
  CREATE INDEX "mk_objections_items_order_idx" ON "mk_objections_items" USING btree ("_order");
  CREATE INDEX "mk_objections_items_parent_id_idx" ON "mk_objections_items" USING btree ("_parent_id");
  CREATE INDEX "mk_objections_order_idx" ON "mk_objections" USING btree ("_order");
  CREATE INDEX "mk_objections_parent_id_idx" ON "mk_objections" USING btree ("_parent_id");
  CREATE INDEX "mk_objections_path_idx" ON "mk_objections" USING btree ("_path");
  CREATE INDEX "mk_roles_roles_points_order_idx" ON "mk_roles_roles_points" USING btree ("_order");
  CREATE INDEX "mk_roles_roles_points_parent_id_idx" ON "mk_roles_roles_points" USING btree ("_parent_id");
  CREATE INDEX "mk_roles_roles_order_idx" ON "mk_roles_roles" USING btree ("_order");
  CREATE INDEX "mk_roles_roles_parent_id_idx" ON "mk_roles_roles" USING btree ("_parent_id");
  CREATE INDEX "mk_roles_order_idx" ON "mk_roles" USING btree ("_order");
  CREATE INDEX "mk_roles_parent_id_idx" ON "mk_roles" USING btree ("_parent_id");
  CREATE INDEX "mk_roles_path_idx" ON "mk_roles" USING btree ("_path");
  CREATE INDEX "_mk_assurance_v_items_order_idx" ON "_mk_assurance_v_items" USING btree ("_order");
  CREATE INDEX "_mk_assurance_v_items_parent_id_idx" ON "_mk_assurance_v_items" USING btree ("_parent_id");
  CREATE INDEX "_mk_assurance_v_order_idx" ON "_mk_assurance_v" USING btree ("_order");
  CREATE INDEX "_mk_assurance_v_parent_id_idx" ON "_mk_assurance_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_assurance_v_path_idx" ON "_mk_assurance_v" USING btree ("_path");
  CREATE INDEX "_mk_compare_rows_v_rows_order_idx" ON "_mk_compare_rows_v_rows" USING btree ("_order");
  CREATE INDEX "_mk_compare_rows_v_rows_parent_id_idx" ON "_mk_compare_rows_v_rows" USING btree ("_parent_id");
  CREATE INDEX "_mk_compare_rows_v_order_idx" ON "_mk_compare_rows_v" USING btree ("_order");
  CREATE INDEX "_mk_compare_rows_v_parent_id_idx" ON "_mk_compare_rows_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_compare_rows_v_path_idx" ON "_mk_compare_rows_v" USING btree ("_path");
  CREATE INDEX "_mk_steps_v_steps_order_idx" ON "_mk_steps_v_steps" USING btree ("_order");
  CREATE INDEX "_mk_steps_v_steps_parent_id_idx" ON "_mk_steps_v_steps" USING btree ("_parent_id");
  CREATE INDEX "_mk_steps_v_order_idx" ON "_mk_steps_v" USING btree ("_order");
  CREATE INDEX "_mk_steps_v_parent_id_idx" ON "_mk_steps_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_steps_v_path_idx" ON "_mk_steps_v" USING btree ("_path");
  CREATE INDEX "_mk_objections_v_items_order_idx" ON "_mk_objections_v_items" USING btree ("_order");
  CREATE INDEX "_mk_objections_v_items_parent_id_idx" ON "_mk_objections_v_items" USING btree ("_parent_id");
  CREATE INDEX "_mk_objections_v_order_idx" ON "_mk_objections_v" USING btree ("_order");
  CREATE INDEX "_mk_objections_v_parent_id_idx" ON "_mk_objections_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_objections_v_path_idx" ON "_mk_objections_v" USING btree ("_path");
  CREATE INDEX "_mk_roles_v_roles_points_order_idx" ON "_mk_roles_v_roles_points" USING btree ("_order");
  CREATE INDEX "_mk_roles_v_roles_points_parent_id_idx" ON "_mk_roles_v_roles_points" USING btree ("_parent_id");
  CREATE INDEX "_mk_roles_v_roles_order_idx" ON "_mk_roles_v_roles" USING btree ("_order");
  CREATE INDEX "_mk_roles_v_roles_parent_id_idx" ON "_mk_roles_v_roles" USING btree ("_parent_id");
  CREATE INDEX "_mk_roles_v_order_idx" ON "_mk_roles_v" USING btree ("_order");
  CREATE INDEX "_mk_roles_v_parent_id_idx" ON "_mk_roles_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_roles_v_path_idx" ON "_mk_roles_v" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "mk_assurance_items" CASCADE;
  DROP TABLE "mk_assurance" CASCADE;
  DROP TABLE "mk_compare_rows_rows" CASCADE;
  DROP TABLE "mk_compare_rows" CASCADE;
  DROP TABLE "mk_steps_steps" CASCADE;
  DROP TABLE "mk_steps" CASCADE;
  DROP TABLE "mk_objections_items" CASCADE;
  DROP TABLE "mk_objections" CASCADE;
  DROP TABLE "mk_roles_roles_points" CASCADE;
  DROP TABLE "mk_roles_roles" CASCADE;
  DROP TABLE "mk_roles" CASCADE;
  DROP TABLE "_mk_assurance_v_items" CASCADE;
  DROP TABLE "_mk_assurance_v" CASCADE;
  DROP TABLE "_mk_compare_rows_v_rows" CASCADE;
  DROP TABLE "_mk_compare_rows_v" CASCADE;
  DROP TABLE "_mk_steps_v_steps" CASCADE;
  DROP TABLE "_mk_steps_v" CASCADE;
  DROP TABLE "_mk_objections_v_items" CASCADE;
  DROP TABLE "_mk_objections_v" CASCADE;
  DROP TABLE "_mk_roles_v_roles_points" CASCADE;
  DROP TABLE "_mk_roles_v_roles" CASCADE;
  DROP TABLE "_mk_roles_v" CASCADE;
  DROP TYPE "public"."enum_mk_roles_roles_visual";
  DROP TYPE "public"."enum__mk_roles_v_roles_visual";`)
}
