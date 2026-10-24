import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_mk_reviewed_label" AS ENUM('reviewed', 'updated');
  CREATE TYPE "public"."enum__mk_reviewed_v_label" AS ENUM('reviewed', 'updated');
  CREATE TABLE "mk_reviewed" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" "enum_mk_reviewed_label" DEFAULT 'reviewed',
  	"date" timestamp(3) with time zone,
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_roadmap_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "mk_roadmap" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"empty_title" varchar,
  	"empty_body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_reviewed_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"label" "enum__mk_reviewed_v_label" DEFAULT 'reviewed',
  	"date" timestamp(3) with time zone,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_roadmap_v_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_roadmap_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"empty_title" varchar,
  	"empty_body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "mk_reviewed" ADD CONSTRAINT "mk_reviewed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_roadmap_cards" ADD CONSTRAINT "mk_roadmap_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_roadmap"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_roadmap" ADD CONSTRAINT "mk_roadmap_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_reviewed_v" ADD CONSTRAINT "_mk_reviewed_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_roadmap_v_cards" ADD CONSTRAINT "_mk_roadmap_v_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_roadmap_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_roadmap_v" ADD CONSTRAINT "_mk_roadmap_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "mk_reviewed_order_idx" ON "mk_reviewed" USING btree ("_order");
  CREATE INDEX "mk_reviewed_parent_id_idx" ON "mk_reviewed" USING btree ("_parent_id");
  CREATE INDEX "mk_reviewed_path_idx" ON "mk_reviewed" USING btree ("_path");
  CREATE INDEX "mk_roadmap_cards_order_idx" ON "mk_roadmap_cards" USING btree ("_order");
  CREATE INDEX "mk_roadmap_cards_parent_id_idx" ON "mk_roadmap_cards" USING btree ("_parent_id");
  CREATE INDEX "mk_roadmap_order_idx" ON "mk_roadmap" USING btree ("_order");
  CREATE INDEX "mk_roadmap_parent_id_idx" ON "mk_roadmap" USING btree ("_parent_id");
  CREATE INDEX "mk_roadmap_path_idx" ON "mk_roadmap" USING btree ("_path");
  CREATE INDEX "_mk_reviewed_v_order_idx" ON "_mk_reviewed_v" USING btree ("_order");
  CREATE INDEX "_mk_reviewed_v_parent_id_idx" ON "_mk_reviewed_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_reviewed_v_path_idx" ON "_mk_reviewed_v" USING btree ("_path");
  CREATE INDEX "_mk_roadmap_v_cards_order_idx" ON "_mk_roadmap_v_cards" USING btree ("_order");
  CREATE INDEX "_mk_roadmap_v_cards_parent_id_idx" ON "_mk_roadmap_v_cards" USING btree ("_parent_id");
  CREATE INDEX "_mk_roadmap_v_order_idx" ON "_mk_roadmap_v" USING btree ("_order");
  CREATE INDEX "_mk_roadmap_v_parent_id_idx" ON "_mk_roadmap_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_roadmap_v_path_idx" ON "_mk_roadmap_v" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "mk_reviewed" CASCADE;
  DROP TABLE "mk_roadmap_cards" CASCADE;
  DROP TABLE "mk_roadmap" CASCADE;
  DROP TABLE "_mk_reviewed_v" CASCADE;
  DROP TABLE "_mk_roadmap_v_cards" CASCADE;
  DROP TABLE "_mk_roadmap_v" CASCADE;
  DROP TYPE "public"."enum_mk_reviewed_label";
  DROP TYPE "public"."enum__mk_reviewed_v_label";`)
}
