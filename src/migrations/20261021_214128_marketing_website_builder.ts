import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_mk_live_demo_demo" AS ENUM('tokenDial', 'courseGuide', 'courseStatus');
  CREATE TYPE "public"."enum__mk_live_demo_v_demo" AS ENUM('tokenDial', 'courseGuide', 'courseStatus');
  ALTER TYPE "public"."enum_mk_cards_cards_icon" ADD VALUE 'expand';
  ALTER TYPE "public"."enum_mk_cards_cards_icon" ADD VALUE 'arrow-up-right';
  ALTER TYPE "public"."enum__mk_cards_v_cards_icon" ADD VALUE 'expand';
  ALTER TYPE "public"."enum__mk_cards_v_cards_icon" ADD VALUE 'arrow-up-right';
  CREATE TABLE "mk_builder_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"subhead" varchar,
  	"primary_label" varchar DEFAULT 'Book a demo',
  	"primary_href" varchar DEFAULT '/book-a-demo',
  	"secondary_label" varchar DEFAULT 'Get your free homepage',
  	"secondary_href" varchar DEFAULT '/switching',
  	"block_name" varchar
  );
  
  CREATE TABLE "mk_live_demo_details" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "mk_live_demo" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"demo" "enum_mk_live_demo_demo" DEFAULT 'tokenDial',
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_builder_hero_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"subhead" varchar,
  	"primary_label" varchar DEFAULT 'Book a demo',
  	"primary_href" varchar DEFAULT '/book-a-demo',
  	"secondary_label" varchar DEFAULT 'Get your free homepage',
  	"secondary_href" varchar DEFAULT '/switching',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_mk_live_demo_v_details" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_mk_live_demo_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"demo" "enum__mk_live_demo_v_demo" DEFAULT 'tokenDial',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "mk_builder_hero" ADD CONSTRAINT "mk_builder_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_live_demo_details" ADD CONSTRAINT "mk_live_demo_details_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mk_live_demo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mk_live_demo" ADD CONSTRAINT "mk_live_demo_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_builder_hero_v" ADD CONSTRAINT "_mk_builder_hero_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_live_demo_v_details" ADD CONSTRAINT "_mk_live_demo_v_details_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_mk_live_demo_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_mk_live_demo_v" ADD CONSTRAINT "_mk_live_demo_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_marketing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "mk_builder_hero_order_idx" ON "mk_builder_hero" USING btree ("_order");
  CREATE INDEX "mk_builder_hero_parent_id_idx" ON "mk_builder_hero" USING btree ("_parent_id");
  CREATE INDEX "mk_builder_hero_path_idx" ON "mk_builder_hero" USING btree ("_path");
  CREATE INDEX "mk_live_demo_details_order_idx" ON "mk_live_demo_details" USING btree ("_order");
  CREATE INDEX "mk_live_demo_details_parent_id_idx" ON "mk_live_demo_details" USING btree ("_parent_id");
  CREATE INDEX "mk_live_demo_order_idx" ON "mk_live_demo" USING btree ("_order");
  CREATE INDEX "mk_live_demo_parent_id_idx" ON "mk_live_demo" USING btree ("_parent_id");
  CREATE INDEX "mk_live_demo_path_idx" ON "mk_live_demo" USING btree ("_path");
  CREATE INDEX "_mk_builder_hero_v_order_idx" ON "_mk_builder_hero_v" USING btree ("_order");
  CREATE INDEX "_mk_builder_hero_v_parent_id_idx" ON "_mk_builder_hero_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_builder_hero_v_path_idx" ON "_mk_builder_hero_v" USING btree ("_path");
  CREATE INDEX "_mk_live_demo_v_details_order_idx" ON "_mk_live_demo_v_details" USING btree ("_order");
  CREATE INDEX "_mk_live_demo_v_details_parent_id_idx" ON "_mk_live_demo_v_details" USING btree ("_parent_id");
  CREATE INDEX "_mk_live_demo_v_order_idx" ON "_mk_live_demo_v" USING btree ("_order");
  CREATE INDEX "_mk_live_demo_v_parent_id_idx" ON "_mk_live_demo_v" USING btree ("_parent_id");
  CREATE INDEX "_mk_live_demo_v_path_idx" ON "_mk_live_demo_v" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "mk_builder_hero" CASCADE;
  DROP TABLE "mk_live_demo_details" CASCADE;
  DROP TABLE "mk_live_demo" CASCADE;
  DROP TABLE "_mk_builder_hero_v" CASCADE;
  DROP TABLE "_mk_live_demo_v_details" CASCADE;
  DROP TABLE "_mk_live_demo_v" CASCADE;
  ALTER TABLE "mk_cards_cards" ALTER COLUMN "icon" SET DATA TYPE text;
  ALTER TABLE "mk_cards_cards" ALTER COLUMN "icon" SET DEFAULT 'check'::text;
  DROP TYPE "public"."enum_mk_cards_cards_icon";
  CREATE TYPE "public"."enum_mk_cards_cards_icon" AS ENUM('check', 'clock', 'calendar', 'players', 'flag', 'lock', 'mail', 'phone', 'pin', 'search', 'file', 'download', 'info', 'sun');
  ALTER TABLE "mk_cards_cards" ALTER COLUMN "icon" SET DEFAULT 'check'::"public"."enum_mk_cards_cards_icon";
  ALTER TABLE "mk_cards_cards" ALTER COLUMN "icon" SET DATA TYPE "public"."enum_mk_cards_cards_icon" USING "icon"::"public"."enum_mk_cards_cards_icon";
  ALTER TABLE "_mk_cards_v_cards" ALTER COLUMN "icon" SET DATA TYPE text;
  ALTER TABLE "_mk_cards_v_cards" ALTER COLUMN "icon" SET DEFAULT 'check'::text;
  DROP TYPE "public"."enum__mk_cards_v_cards_icon";
  CREATE TYPE "public"."enum__mk_cards_v_cards_icon" AS ENUM('check', 'clock', 'calendar', 'players', 'flag', 'lock', 'mail', 'phone', 'pin', 'search', 'file', 'download', 'info', 'sun');
  ALTER TABLE "_mk_cards_v_cards" ALTER COLUMN "icon" SET DEFAULT 'check'::"public"."enum__mk_cards_v_cards_icon";
  ALTER TABLE "_mk_cards_v_cards" ALTER COLUMN "icon" SET DATA TYPE "public"."enum__mk_cards_v_cards_icon" USING "icon"::"public"."enum__mk_cards_v_cards_icon";
  DROP TYPE "public"."enum_mk_live_demo_demo";
  DROP TYPE "public"."enum__mk_live_demo_v_demo";`)
}
