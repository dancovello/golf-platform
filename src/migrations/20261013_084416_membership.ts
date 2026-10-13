import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_membership_tiers_link_type" AS ENUM('page', 'url');
  CREATE TYPE "public"."enum_pages_blocks_membership_style" AS ENUM('cards', 'compare', 'enquire');
  CREATE TYPE "public"."enum_pages_blocks_membership_action_type" AS ENUM('page', 'url');
  CREATE TYPE "public"."enum_pages_blocks_membership_card_link_type" AS ENUM('page', 'url');
  CREATE TABLE "pages_blocks_membership_tiers_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_membership_tiers_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "pages_blocks_membership_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"price" varchar,
  	"period" varchar,
  	"description" varchar,
  	"availability" varchar,
  	"recommended" boolean,
  	"link_type" "enum_pages_blocks_membership_tiers_link_type" DEFAULT 'page',
  	"link_page_id" uuid,
  	"link_url" varchar
  );
  
  CREATE TABLE "pages_blocks_membership_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "pages_blocks_membership" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_membership_style" DEFAULT 'cards' NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar NOT NULL,
  	"intro" varchar,
  	"button_label" varchar,
  	"action_label" varchar,
  	"action_type" "enum_pages_blocks_membership_action_type" DEFAULT 'page',
  	"action_page_id" uuid,
  	"action_url" varchar,
  	"card_heading" varchar,
  	"card_text" varchar,
  	"card_link_label" varchar,
  	"card_link_type" "enum_pages_blocks_membership_card_link_type" DEFAULT 'page',
  	"card_link_page_id" uuid,
  	"card_link_url" varchar,
  	"card_note" varchar,
  	"note" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_membership_tiers_benefits" ADD CONSTRAINT "pages_blocks_membership_tiers_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_membership_tiers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_membership_tiers_values" ADD CONSTRAINT "pages_blocks_membership_tiers_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_membership_tiers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_membership_tiers" ADD CONSTRAINT "pages_blocks_membership_tiers_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_membership_tiers" ADD CONSTRAINT "pages_blocks_membership_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_membership"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_membership_features" ADD CONSTRAINT "pages_blocks_membership_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_membership"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_membership" ADD CONSTRAINT "pages_blocks_membership_action_page_id_pages_id_fk" FOREIGN KEY ("action_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_membership" ADD CONSTRAINT "pages_blocks_membership_card_link_page_id_pages_id_fk" FOREIGN KEY ("card_link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_membership" ADD CONSTRAINT "pages_blocks_membership_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_membership_tiers_benefits_order_idx" ON "pages_blocks_membership_tiers_benefits" USING btree ("_order");
  CREATE INDEX "pages_blocks_membership_tiers_benefits_parent_id_idx" ON "pages_blocks_membership_tiers_benefits" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_membership_tiers_values_order_idx" ON "pages_blocks_membership_tiers_values" USING btree ("_order");
  CREATE INDEX "pages_blocks_membership_tiers_values_parent_id_idx" ON "pages_blocks_membership_tiers_values" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_membership_tiers_order_idx" ON "pages_blocks_membership_tiers" USING btree ("_order");
  CREATE INDEX "pages_blocks_membership_tiers_parent_id_idx" ON "pages_blocks_membership_tiers" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_membership_tiers_link_link_page_idx" ON "pages_blocks_membership_tiers" USING btree ("link_page_id");
  CREATE INDEX "pages_blocks_membership_features_order_idx" ON "pages_blocks_membership_features" USING btree ("_order");
  CREATE INDEX "pages_blocks_membership_features_parent_id_idx" ON "pages_blocks_membership_features" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_membership_order_idx" ON "pages_blocks_membership" USING btree ("_order");
  CREATE INDEX "pages_blocks_membership_parent_id_idx" ON "pages_blocks_membership" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_membership_path_idx" ON "pages_blocks_membership" USING btree ("_path");
  CREATE INDEX "pages_blocks_membership_action_action_page_idx" ON "pages_blocks_membership" USING btree ("action_page_id");
  CREATE INDEX "pages_blocks_membership_card_link_card_link_page_idx" ON "pages_blocks_membership" USING btree ("card_link_page_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_membership_tiers_benefits" CASCADE;
  DROP TABLE "pages_blocks_membership_tiers_values" CASCADE;
  DROP TABLE "pages_blocks_membership_tiers" CASCADE;
  DROP TABLE "pages_blocks_membership_features" CASCADE;
  DROP TABLE "pages_blocks_membership" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_membership_tiers_link_type";
  DROP TYPE "public"."enum_pages_blocks_membership_style";
  DROP TYPE "public"."enum_pages_blocks_membership_action_type";
  DROP TYPE "public"."enum_pages_blocks_membership_card_link_type";`)
}
