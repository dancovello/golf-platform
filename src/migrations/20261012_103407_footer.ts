import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_club_settings_footer_link_columns_links_link_type" AS ENUM('page', 'url');
  CREATE TYPE "public"."enum_club_settings_footer_social_network" AS ENUM('instagram', 'facebook', 'x', 'youtube', 'linkedin', 'tiktok');
  CREATE TYPE "public"."enum_club_settings_footer_legal_links_link_type" AS ENUM('page', 'url');
  CREATE TYPE "public"."enum_club_settings_footer_style" AS ENUM('brandColumns', 'lightColumns', 'editorial');
  CREATE TYPE "public"."enum_club_settings_footer_hours_link_type" AS ENUM('page', 'url');
  CREATE TYPE "public"."enum_club_settings_footer_secondary_button_type" AS ENUM('page', 'url');
  CREATE TABLE "club_settings_footer_link_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_label" varchar NOT NULL,
  	"link_type" "enum_club_settings_footer_link_columns_links_link_type" DEFAULT 'page',
  	"link_page_id" uuid,
  	"link_url" varchar
  );
  
  CREATE TABLE "club_settings_footer_link_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL
  );
  
  CREATE TABLE "club_settings_footer_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"place" varchar NOT NULL,
  	"times" varchar NOT NULL
  );
  
  CREATE TABLE "club_settings_footer_social" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"network" "enum_club_settings_footer_social_network" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "club_settings_footer_legal_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_label" varchar NOT NULL,
  	"link_type" "enum_club_settings_footer_legal_links_link_type" DEFAULT 'page',
  	"link_page_id" uuid,
  	"link_url" varchar
  );
  
  ALTER TABLE "club_settings" ADD COLUMN "footer_style" "enum_club_settings_footer_style" DEFAULT 'brandColumns' NOT NULL;
  ALTER TABLE "club_settings" ADD COLUMN "footer_about" varchar;
  ALTER TABLE "club_settings" ADD COLUMN "footer_hours_link_label" varchar;
  ALTER TABLE "club_settings" ADD COLUMN "footer_hours_link_type" "enum_club_settings_footer_hours_link_type" DEFAULT 'page';
  ALTER TABLE "club_settings" ADD COLUMN "footer_hours_link_page_id" uuid;
  ALTER TABLE "club_settings" ADD COLUMN "footer_hours_link_url" varchar;
  ALTER TABLE "club_settings" ADD COLUMN "footer_email" varchar;
  ALTER TABLE "club_settings" ADD COLUMN "footer_directions" varchar;
  ALTER TABLE "club_settings" ADD COLUMN "footer_address" varchar;
  ALTER TABLE "club_settings" ADD COLUMN "footer_secondary_button_label" varchar;
  ALTER TABLE "club_settings" ADD COLUMN "footer_secondary_button_type" "enum_club_settings_footer_secondary_button_type" DEFAULT 'page';
  ALTER TABLE "club_settings" ADD COLUMN "footer_secondary_button_page_id" uuid;
  ALTER TABLE "club_settings" ADD COLUMN "footer_secondary_button_url" varchar;
  ALTER TABLE "club_settings_footer_link_columns_links" ADD CONSTRAINT "club_settings_footer_link_columns_links_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "club_settings_footer_link_columns_links" ADD CONSTRAINT "club_settings_footer_link_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."club_settings_footer_link_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "club_settings_footer_link_columns" ADD CONSTRAINT "club_settings_footer_link_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."club_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "club_settings_footer_hours" ADD CONSTRAINT "club_settings_footer_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."club_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "club_settings_footer_social" ADD CONSTRAINT "club_settings_footer_social_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."club_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "club_settings_footer_legal_links" ADD CONSTRAINT "club_settings_footer_legal_links_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "club_settings_footer_legal_links" ADD CONSTRAINT "club_settings_footer_legal_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."club_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "club_settings_footer_link_columns_links_order_idx" ON "club_settings_footer_link_columns_links" USING btree ("_order");
  CREATE INDEX "club_settings_footer_link_columns_links_parent_id_idx" ON "club_settings_footer_link_columns_links" USING btree ("_parent_id");
  CREATE INDEX "club_settings_footer_link_columns_links_link_link_page_idx" ON "club_settings_footer_link_columns_links" USING btree ("link_page_id");
  CREATE INDEX "club_settings_footer_link_columns_order_idx" ON "club_settings_footer_link_columns" USING btree ("_order");
  CREATE INDEX "club_settings_footer_link_columns_parent_id_idx" ON "club_settings_footer_link_columns" USING btree ("_parent_id");
  CREATE INDEX "club_settings_footer_hours_order_idx" ON "club_settings_footer_hours" USING btree ("_order");
  CREATE INDEX "club_settings_footer_hours_parent_id_idx" ON "club_settings_footer_hours" USING btree ("_parent_id");
  CREATE INDEX "club_settings_footer_social_order_idx" ON "club_settings_footer_social" USING btree ("_order");
  CREATE INDEX "club_settings_footer_social_parent_id_idx" ON "club_settings_footer_social" USING btree ("_parent_id");
  CREATE INDEX "club_settings_footer_legal_links_order_idx" ON "club_settings_footer_legal_links" USING btree ("_order");
  CREATE INDEX "club_settings_footer_legal_links_parent_id_idx" ON "club_settings_footer_legal_links" USING btree ("_parent_id");
  CREATE INDEX "club_settings_footer_legal_links_link_link_page_idx" ON "club_settings_footer_legal_links" USING btree ("link_page_id");
  ALTER TABLE "club_settings" ADD CONSTRAINT "club_settings_footer_hours_link_page_id_pages_id_fk" FOREIGN KEY ("footer_hours_link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "club_settings" ADD CONSTRAINT "club_settings_footer_secondary_button_page_id_pages_id_fk" FOREIGN KEY ("footer_secondary_button_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "club_settings_footer_hours_link_footer_hours_link_page_idx" ON "club_settings" USING btree ("footer_hours_link_page_id");
  CREATE INDEX "club_settings_footer_secondary_button_footer_secondary_b_idx" ON "club_settings" USING btree ("footer_secondary_button_page_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "club_settings_footer_link_columns_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "club_settings_footer_link_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "club_settings_footer_hours" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "club_settings_footer_social" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "club_settings_footer_legal_links" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "club_settings_footer_link_columns_links" CASCADE;
  DROP TABLE "club_settings_footer_link_columns" CASCADE;
  DROP TABLE "club_settings_footer_hours" CASCADE;
  DROP TABLE "club_settings_footer_social" CASCADE;
  DROP TABLE "club_settings_footer_legal_links" CASCADE;
  ALTER TABLE "club_settings" DROP CONSTRAINT "club_settings_footer_hours_link_page_id_pages_id_fk";
  
  ALTER TABLE "club_settings" DROP CONSTRAINT "club_settings_footer_secondary_button_page_id_pages_id_fk";
  
  DROP INDEX "club_settings_footer_hours_link_footer_hours_link_page_idx";
  DROP INDEX "club_settings_footer_secondary_button_footer_secondary_b_idx";
  ALTER TABLE "club_settings" DROP COLUMN "footer_style";
  ALTER TABLE "club_settings" DROP COLUMN "footer_about";
  ALTER TABLE "club_settings" DROP COLUMN "footer_hours_link_label";
  ALTER TABLE "club_settings" DROP COLUMN "footer_hours_link_type";
  ALTER TABLE "club_settings" DROP COLUMN "footer_hours_link_page_id";
  ALTER TABLE "club_settings" DROP COLUMN "footer_hours_link_url";
  ALTER TABLE "club_settings" DROP COLUMN "footer_email";
  ALTER TABLE "club_settings" DROP COLUMN "footer_directions";
  ALTER TABLE "club_settings" DROP COLUMN "footer_address";
  ALTER TABLE "club_settings" DROP COLUMN "footer_secondary_button_label";
  ALTER TABLE "club_settings" DROP COLUMN "footer_secondary_button_type";
  ALTER TABLE "club_settings" DROP COLUMN "footer_secondary_button_page_id";
  ALTER TABLE "club_settings" DROP COLUMN "footer_secondary_button_url";
  DROP TYPE "public"."enum_club_settings_footer_link_columns_links_link_type";
  DROP TYPE "public"."enum_club_settings_footer_social_network";
  DROP TYPE "public"."enum_club_settings_footer_legal_links_link_type";
  DROP TYPE "public"."enum_club_settings_footer_style";
  DROP TYPE "public"."enum_club_settings_footer_hours_link_type";
  DROP TYPE "public"."enum_club_settings_footer_secondary_button_type";`)
}
