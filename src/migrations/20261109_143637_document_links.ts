import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_rich_text_buttons_link_type" AS ENUM('page', 'builtIn', 'url', 'document');
  CREATE TYPE "public"."enum_pages_blocks_rich_text_buttons_link_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TYPE "public"."enum__pages_v_blocks_rich_text_buttons_link_type" AS ENUM('page', 'builtIn', 'url', 'document');
  CREATE TYPE "public"."enum__pages_v_blocks_rich_text_buttons_link_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  ALTER TYPE "public"."enum_pages_blocks_hero_primary_button_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum_pages_blocks_hero_secondary_link_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum_pages_blocks_cta_card_grid_cards_link_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum_pages_blocks_cta_card_grid_view_all_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum_pages_blocks_two_column_link_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum_pages_blocks_rate_table_button_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum_pages_blocks_team_action_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum_pages_blocks_team_view_all_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum_pages_blocks_membership_tiers_link_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum_pages_blocks_membership_action_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum_pages_blocks_membership_card_link_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum__pages_v_blocks_hero_primary_button_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum__pages_v_blocks_hero_secondary_link_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum__pages_v_blocks_cta_card_grid_cards_link_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum__pages_v_blocks_cta_card_grid_view_all_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum__pages_v_blocks_two_column_link_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum__pages_v_blocks_rate_table_button_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum__pages_v_blocks_team_action_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum__pages_v_blocks_team_view_all_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum__pages_v_blocks_membership_tiers_link_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum__pages_v_blocks_membership_action_type" ADD VALUE 'document';
  ALTER TYPE "public"."enum__pages_v_blocks_membership_card_link_type" ADD VALUE 'document';
  CREATE TABLE "pages_blocks_rich_text_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_label" varchar,
  	"link_type" "enum_pages_blocks_rich_text_buttons_link_type" DEFAULT 'page',
  	"link_page_id" uuid,
  	"link_document_id" uuid,
  	"link_built_in" "enum_pages_blocks_rich_text_buttons_link_built_in",
  	"link_url" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rich_text_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"link_label" varchar,
  	"link_type" "enum__pages_v_blocks_rich_text_buttons_link_type" DEFAULT 'page',
  	"link_page_id" uuid,
  	"link_document_id" uuid,
  	"link_built_in" "enum__pages_v_blocks_rich_text_buttons_link_built_in",
  	"link_url" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "primary_button_document_id" uuid;
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "secondary_link_document_id" uuid;
  ALTER TABLE "pages_blocks_cta_card_grid_cards" ADD COLUMN "link_document_id" uuid;
  ALTER TABLE "pages_blocks_cta_card_grid" ADD COLUMN "view_all_document_id" uuid;
  ALTER TABLE "pages_blocks_two_column" ADD COLUMN "link_document_id" uuid;
  ALTER TABLE "pages_blocks_rate_table" ADD COLUMN "button_document_id" uuid;
  ALTER TABLE "pages_blocks_team" ADD COLUMN "action_document_id" uuid;
  ALTER TABLE "pages_blocks_team" ADD COLUMN "view_all_document_id" uuid;
  ALTER TABLE "pages_blocks_membership_tiers" ADD COLUMN "link_document_id" uuid;
  ALTER TABLE "pages_blocks_membership" ADD COLUMN "action_document_id" uuid;
  ALTER TABLE "pages_blocks_membership" ADD COLUMN "card_link_document_id" uuid;
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "primary_button_document_id" uuid;
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "secondary_link_document_id" uuid;
  ALTER TABLE "_pages_v_blocks_cta_card_grid_cards" ADD COLUMN "link_document_id" uuid;
  ALTER TABLE "_pages_v_blocks_cta_card_grid" ADD COLUMN "view_all_document_id" uuid;
  ALTER TABLE "_pages_v_blocks_two_column" ADD COLUMN "link_document_id" uuid;
  ALTER TABLE "_pages_v_blocks_rate_table" ADD COLUMN "button_document_id" uuid;
  ALTER TABLE "_pages_v_blocks_team" ADD COLUMN "action_document_id" uuid;
  ALTER TABLE "_pages_v_blocks_team" ADD COLUMN "view_all_document_id" uuid;
  ALTER TABLE "_pages_v_blocks_membership_tiers" ADD COLUMN "link_document_id" uuid;
  ALTER TABLE "_pages_v_blocks_membership" ADD COLUMN "action_document_id" uuid;
  ALTER TABLE "_pages_v_blocks_membership" ADD COLUMN "card_link_document_id" uuid;
  ALTER TABLE "pages_blocks_rich_text_buttons" ADD CONSTRAINT "pages_blocks_rich_text_buttons_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text_buttons" ADD CONSTRAINT "pages_blocks_rich_text_buttons_link_document_id_documents_id_fk" FOREIGN KEY ("link_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text_buttons" ADD CONSTRAINT "pages_blocks_rich_text_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text_buttons" ADD CONSTRAINT "_pages_v_blocks_rich_text_buttons_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text_buttons" ADD CONSTRAINT "_pages_v_blocks_rich_text_buttons_link_document_id_documents_id_fk" FOREIGN KEY ("link_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text_buttons" ADD CONSTRAINT "_pages_v_blocks_rich_text_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_rich_text_buttons_order_idx" ON "pages_blocks_rich_text_buttons" USING btree ("_order");
  CREATE INDEX "pages_blocks_rich_text_buttons_parent_id_idx" ON "pages_blocks_rich_text_buttons" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_buttons_link_link_page_idx" ON "pages_blocks_rich_text_buttons" USING btree ("link_page_id");
  CREATE INDEX "pages_blocks_rich_text_buttons_link_link_document_idx" ON "pages_blocks_rich_text_buttons" USING btree ("link_document_id");
  CREATE INDEX "_pages_v_blocks_rich_text_buttons_order_idx" ON "_pages_v_blocks_rich_text_buttons" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rich_text_buttons_parent_id_idx" ON "_pages_v_blocks_rich_text_buttons" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_buttons_link_link_page_idx" ON "_pages_v_blocks_rich_text_buttons" USING btree ("link_page_id");
  CREATE INDEX "_pages_v_blocks_rich_text_buttons_link_link_document_idx" ON "_pages_v_blocks_rich_text_buttons" USING btree ("link_document_id");
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_primary_button_document_id_documents_id_fk" FOREIGN KEY ("primary_button_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_secondary_link_document_id_documents_id_fk" FOREIGN KEY ("secondary_link_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_card_grid_cards" ADD CONSTRAINT "pages_blocks_cta_card_grid_cards_link_document_id_documents_id_fk" FOREIGN KEY ("link_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_card_grid" ADD CONSTRAINT "pages_blocks_cta_card_grid_view_all_document_id_documents_id_fk" FOREIGN KEY ("view_all_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_two_column" ADD CONSTRAINT "pages_blocks_two_column_link_document_id_documents_id_fk" FOREIGN KEY ("link_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_rate_table" ADD CONSTRAINT "pages_blocks_rate_table_button_document_id_documents_id_fk" FOREIGN KEY ("button_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_team" ADD CONSTRAINT "pages_blocks_team_action_document_id_documents_id_fk" FOREIGN KEY ("action_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_team" ADD CONSTRAINT "pages_blocks_team_view_all_document_id_documents_id_fk" FOREIGN KEY ("view_all_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_membership_tiers" ADD CONSTRAINT "pages_blocks_membership_tiers_link_document_id_documents_id_fk" FOREIGN KEY ("link_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_membership" ADD CONSTRAINT "pages_blocks_membership_action_document_id_documents_id_fk" FOREIGN KEY ("action_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_membership" ADD CONSTRAINT "pages_blocks_membership_card_link_document_id_documents_id_fk" FOREIGN KEY ("card_link_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_primary_button_document_id_documents_id_fk" FOREIGN KEY ("primary_button_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_secondary_link_document_id_documents_id_fk" FOREIGN KEY ("secondary_link_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_card_grid_cards" ADD CONSTRAINT "_pages_v_blocks_cta_card_grid_cards_link_document_id_documents_id_fk" FOREIGN KEY ("link_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_card_grid" ADD CONSTRAINT "_pages_v_blocks_cta_card_grid_view_all_document_id_documents_id_fk" FOREIGN KEY ("view_all_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_two_column" ADD CONSTRAINT "_pages_v_blocks_two_column_link_document_id_documents_id_fk" FOREIGN KEY ("link_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rate_table" ADD CONSTRAINT "_pages_v_blocks_rate_table_button_document_id_documents_id_fk" FOREIGN KEY ("button_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team" ADD CONSTRAINT "_pages_v_blocks_team_action_document_id_documents_id_fk" FOREIGN KEY ("action_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team" ADD CONSTRAINT "_pages_v_blocks_team_view_all_document_id_documents_id_fk" FOREIGN KEY ("view_all_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_membership_tiers" ADD CONSTRAINT "_pages_v_blocks_membership_tiers_link_document_id_documents_id_fk" FOREIGN KEY ("link_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_membership" ADD CONSTRAINT "_pages_v_blocks_membership_action_document_id_documents_id_fk" FOREIGN KEY ("action_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_membership" ADD CONSTRAINT "_pages_v_blocks_membership_card_link_document_id_documents_id_fk" FOREIGN KEY ("card_link_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_primary_button_primary_button_document_idx" ON "pages_blocks_hero" USING btree ("primary_button_document_id");
  CREATE INDEX "pages_blocks_hero_secondary_link_secondary_link_document_idx" ON "pages_blocks_hero" USING btree ("secondary_link_document_id");
  CREATE INDEX "pages_blocks_cta_card_grid_cards_link_link_document_idx" ON "pages_blocks_cta_card_grid_cards" USING btree ("link_document_id");
  CREATE INDEX "pages_blocks_cta_card_grid_view_all_view_all_document_idx" ON "pages_blocks_cta_card_grid" USING btree ("view_all_document_id");
  CREATE INDEX "pages_blocks_two_column_link_link_document_idx" ON "pages_blocks_two_column" USING btree ("link_document_id");
  CREATE INDEX "pages_blocks_rate_table_button_button_document_idx" ON "pages_blocks_rate_table" USING btree ("button_document_id");
  CREATE INDEX "pages_blocks_team_action_action_document_idx" ON "pages_blocks_team" USING btree ("action_document_id");
  CREATE INDEX "pages_blocks_team_view_all_view_all_document_idx" ON "pages_blocks_team" USING btree ("view_all_document_id");
  CREATE INDEX "pages_blocks_membership_tiers_link_link_document_idx" ON "pages_blocks_membership_tiers" USING btree ("link_document_id");
  CREATE INDEX "pages_blocks_membership_action_action_document_idx" ON "pages_blocks_membership" USING btree ("action_document_id");
  CREATE INDEX "pages_blocks_membership_card_link_card_link_document_idx" ON "pages_blocks_membership" USING btree ("card_link_document_id");
  CREATE INDEX "_pages_v_blocks_hero_primary_button_primary_button_docum_idx" ON "_pages_v_blocks_hero" USING btree ("primary_button_document_id");
  CREATE INDEX "_pages_v_blocks_hero_secondary_link_secondary_link_docum_idx" ON "_pages_v_blocks_hero" USING btree ("secondary_link_document_id");
  CREATE INDEX "_pages_v_blocks_cta_card_grid_cards_link_link_document_idx" ON "_pages_v_blocks_cta_card_grid_cards" USING btree ("link_document_id");
  CREATE INDEX "_pages_v_blocks_cta_card_grid_view_all_view_all_document_idx" ON "_pages_v_blocks_cta_card_grid" USING btree ("view_all_document_id");
  CREATE INDEX "_pages_v_blocks_two_column_link_link_document_idx" ON "_pages_v_blocks_two_column" USING btree ("link_document_id");
  CREATE INDEX "_pages_v_blocks_rate_table_button_button_document_idx" ON "_pages_v_blocks_rate_table" USING btree ("button_document_id");
  CREATE INDEX "_pages_v_blocks_team_action_action_document_idx" ON "_pages_v_blocks_team" USING btree ("action_document_id");
  CREATE INDEX "_pages_v_blocks_team_view_all_view_all_document_idx" ON "_pages_v_blocks_team" USING btree ("view_all_document_id");
  CREATE INDEX "_pages_v_blocks_membership_tiers_link_link_document_idx" ON "_pages_v_blocks_membership_tiers" USING btree ("link_document_id");
  CREATE INDEX "_pages_v_blocks_membership_action_action_document_idx" ON "_pages_v_blocks_membership" USING btree ("action_document_id");
  CREATE INDEX "_pages_v_blocks_membership_card_link_card_link_document_idx" ON "_pages_v_blocks_membership" USING btree ("card_link_document_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_rich_text_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_rich_text_buttons" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_rich_text_buttons" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text_buttons" CASCADE;
  ALTER TABLE "pages_blocks_hero" DROP CONSTRAINT "pages_blocks_hero_primary_button_document_id_documents_id_fk";
  
  ALTER TABLE "pages_blocks_hero" DROP CONSTRAINT "pages_blocks_hero_secondary_link_document_id_documents_id_fk";
  
  ALTER TABLE "pages_blocks_cta_card_grid_cards" DROP CONSTRAINT "pages_blocks_cta_card_grid_cards_link_document_id_documents_id_fk";
  
  ALTER TABLE "pages_blocks_cta_card_grid" DROP CONSTRAINT "pages_blocks_cta_card_grid_view_all_document_id_documents_id_fk";
  
  ALTER TABLE "pages_blocks_two_column" DROP CONSTRAINT "pages_blocks_two_column_link_document_id_documents_id_fk";
  
  ALTER TABLE "pages_blocks_rate_table" DROP CONSTRAINT "pages_blocks_rate_table_button_document_id_documents_id_fk";
  
  ALTER TABLE "pages_blocks_team" DROP CONSTRAINT "pages_blocks_team_action_document_id_documents_id_fk";
  
  ALTER TABLE "pages_blocks_team" DROP CONSTRAINT "pages_blocks_team_view_all_document_id_documents_id_fk";
  
  ALTER TABLE "pages_blocks_membership_tiers" DROP CONSTRAINT "pages_blocks_membership_tiers_link_document_id_documents_id_fk";
  
  ALTER TABLE "pages_blocks_membership" DROP CONSTRAINT "pages_blocks_membership_action_document_id_documents_id_fk";
  
  ALTER TABLE "pages_blocks_membership" DROP CONSTRAINT "pages_blocks_membership_card_link_document_id_documents_id_fk";
  
  ALTER TABLE "_pages_v_blocks_hero" DROP CONSTRAINT "_pages_v_blocks_hero_primary_button_document_id_documents_id_fk";
  
  ALTER TABLE "_pages_v_blocks_hero" DROP CONSTRAINT "_pages_v_blocks_hero_secondary_link_document_id_documents_id_fk";
  
  ALTER TABLE "_pages_v_blocks_cta_card_grid_cards" DROP CONSTRAINT "_pages_v_blocks_cta_card_grid_cards_link_document_id_documents_id_fk";
  
  ALTER TABLE "_pages_v_blocks_cta_card_grid" DROP CONSTRAINT "_pages_v_blocks_cta_card_grid_view_all_document_id_documents_id_fk";
  
  ALTER TABLE "_pages_v_blocks_two_column" DROP CONSTRAINT "_pages_v_blocks_two_column_link_document_id_documents_id_fk";
  
  ALTER TABLE "_pages_v_blocks_rate_table" DROP CONSTRAINT "_pages_v_blocks_rate_table_button_document_id_documents_id_fk";
  
  ALTER TABLE "_pages_v_blocks_team" DROP CONSTRAINT "_pages_v_blocks_team_action_document_id_documents_id_fk";
  
  ALTER TABLE "_pages_v_blocks_team" DROP CONSTRAINT "_pages_v_blocks_team_view_all_document_id_documents_id_fk";
  
  ALTER TABLE "_pages_v_blocks_membership_tiers" DROP CONSTRAINT "_pages_v_blocks_membership_tiers_link_document_id_documents_id_fk";
  
  ALTER TABLE "_pages_v_blocks_membership" DROP CONSTRAINT "_pages_v_blocks_membership_action_document_id_documents_id_fk";
  
  ALTER TABLE "_pages_v_blocks_membership" DROP CONSTRAINT "_pages_v_blocks_membership_card_link_document_id_documents_id_fk";
  
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "primary_button_type" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "primary_button_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum_pages_blocks_hero_primary_button_type";
  CREATE TYPE "public"."enum_pages_blocks_hero_primary_button_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "primary_button_type" SET DEFAULT 'page'::"public"."enum_pages_blocks_hero_primary_button_type";
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "primary_button_type" SET DATA TYPE "public"."enum_pages_blocks_hero_primary_button_type" USING "primary_button_type"::"public"."enum_pages_blocks_hero_primary_button_type";
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "secondary_link_type" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "secondary_link_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum_pages_blocks_hero_secondary_link_type";
  CREATE TYPE "public"."enum_pages_blocks_hero_secondary_link_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "secondary_link_type" SET DEFAULT 'page'::"public"."enum_pages_blocks_hero_secondary_link_type";
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "secondary_link_type" SET DATA TYPE "public"."enum_pages_blocks_hero_secondary_link_type" USING "secondary_link_type"::"public"."enum_pages_blocks_hero_secondary_link_type";
  ALTER TABLE "pages_blocks_cta_card_grid_cards" ALTER COLUMN "link_type" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_cta_card_grid_cards" ALTER COLUMN "link_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum_pages_blocks_cta_card_grid_cards_link_type";
  CREATE TYPE "public"."enum_pages_blocks_cta_card_grid_cards_link_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "pages_blocks_cta_card_grid_cards" ALTER COLUMN "link_type" SET DEFAULT 'page'::"public"."enum_pages_blocks_cta_card_grid_cards_link_type";
  ALTER TABLE "pages_blocks_cta_card_grid_cards" ALTER COLUMN "link_type" SET DATA TYPE "public"."enum_pages_blocks_cta_card_grid_cards_link_type" USING "link_type"::"public"."enum_pages_blocks_cta_card_grid_cards_link_type";
  ALTER TABLE "pages_blocks_cta_card_grid" ALTER COLUMN "view_all_type" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_cta_card_grid" ALTER COLUMN "view_all_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum_pages_blocks_cta_card_grid_view_all_type";
  CREATE TYPE "public"."enum_pages_blocks_cta_card_grid_view_all_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "pages_blocks_cta_card_grid" ALTER COLUMN "view_all_type" SET DEFAULT 'page'::"public"."enum_pages_blocks_cta_card_grid_view_all_type";
  ALTER TABLE "pages_blocks_cta_card_grid" ALTER COLUMN "view_all_type" SET DATA TYPE "public"."enum_pages_blocks_cta_card_grid_view_all_type" USING "view_all_type"::"public"."enum_pages_blocks_cta_card_grid_view_all_type";
  ALTER TABLE "pages_blocks_two_column" ALTER COLUMN "link_type" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_two_column" ALTER COLUMN "link_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum_pages_blocks_two_column_link_type";
  CREATE TYPE "public"."enum_pages_blocks_two_column_link_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "pages_blocks_two_column" ALTER COLUMN "link_type" SET DEFAULT 'page'::"public"."enum_pages_blocks_two_column_link_type";
  ALTER TABLE "pages_blocks_two_column" ALTER COLUMN "link_type" SET DATA TYPE "public"."enum_pages_blocks_two_column_link_type" USING "link_type"::"public"."enum_pages_blocks_two_column_link_type";
  ALTER TABLE "pages_blocks_rate_table" ALTER COLUMN "button_type" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_rate_table" ALTER COLUMN "button_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum_pages_blocks_rate_table_button_type";
  CREATE TYPE "public"."enum_pages_blocks_rate_table_button_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "pages_blocks_rate_table" ALTER COLUMN "button_type" SET DEFAULT 'page'::"public"."enum_pages_blocks_rate_table_button_type";
  ALTER TABLE "pages_blocks_rate_table" ALTER COLUMN "button_type" SET DATA TYPE "public"."enum_pages_blocks_rate_table_button_type" USING "button_type"::"public"."enum_pages_blocks_rate_table_button_type";
  ALTER TABLE "pages_blocks_team" ALTER COLUMN "action_type" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_team" ALTER COLUMN "action_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum_pages_blocks_team_action_type";
  CREATE TYPE "public"."enum_pages_blocks_team_action_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "pages_blocks_team" ALTER COLUMN "action_type" SET DEFAULT 'page'::"public"."enum_pages_blocks_team_action_type";
  ALTER TABLE "pages_blocks_team" ALTER COLUMN "action_type" SET DATA TYPE "public"."enum_pages_blocks_team_action_type" USING "action_type"::"public"."enum_pages_blocks_team_action_type";
  ALTER TABLE "pages_blocks_team" ALTER COLUMN "view_all_type" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_team" ALTER COLUMN "view_all_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum_pages_blocks_team_view_all_type";
  CREATE TYPE "public"."enum_pages_blocks_team_view_all_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "pages_blocks_team" ALTER COLUMN "view_all_type" SET DEFAULT 'page'::"public"."enum_pages_blocks_team_view_all_type";
  ALTER TABLE "pages_blocks_team" ALTER COLUMN "view_all_type" SET DATA TYPE "public"."enum_pages_blocks_team_view_all_type" USING "view_all_type"::"public"."enum_pages_blocks_team_view_all_type";
  ALTER TABLE "pages_blocks_membership_tiers" ALTER COLUMN "link_type" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_membership_tiers" ALTER COLUMN "link_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum_pages_blocks_membership_tiers_link_type";
  CREATE TYPE "public"."enum_pages_blocks_membership_tiers_link_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "pages_blocks_membership_tiers" ALTER COLUMN "link_type" SET DEFAULT 'page'::"public"."enum_pages_blocks_membership_tiers_link_type";
  ALTER TABLE "pages_blocks_membership_tiers" ALTER COLUMN "link_type" SET DATA TYPE "public"."enum_pages_blocks_membership_tiers_link_type" USING "link_type"::"public"."enum_pages_blocks_membership_tiers_link_type";
  ALTER TABLE "pages_blocks_membership" ALTER COLUMN "action_type" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_membership" ALTER COLUMN "action_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum_pages_blocks_membership_action_type";
  CREATE TYPE "public"."enum_pages_blocks_membership_action_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "pages_blocks_membership" ALTER COLUMN "action_type" SET DEFAULT 'page'::"public"."enum_pages_blocks_membership_action_type";
  ALTER TABLE "pages_blocks_membership" ALTER COLUMN "action_type" SET DATA TYPE "public"."enum_pages_blocks_membership_action_type" USING "action_type"::"public"."enum_pages_blocks_membership_action_type";
  ALTER TABLE "pages_blocks_membership" ALTER COLUMN "card_link_type" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_membership" ALTER COLUMN "card_link_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum_pages_blocks_membership_card_link_type";
  CREATE TYPE "public"."enum_pages_blocks_membership_card_link_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "pages_blocks_membership" ALTER COLUMN "card_link_type" SET DEFAULT 'page'::"public"."enum_pages_blocks_membership_card_link_type";
  ALTER TABLE "pages_blocks_membership" ALTER COLUMN "card_link_type" SET DATA TYPE "public"."enum_pages_blocks_membership_card_link_type" USING "card_link_type"::"public"."enum_pages_blocks_membership_card_link_type";
  ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "primary_button_type" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "primary_button_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum__pages_v_blocks_hero_primary_button_type";
  CREATE TYPE "public"."enum__pages_v_blocks_hero_primary_button_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "primary_button_type" SET DEFAULT 'page'::"public"."enum__pages_v_blocks_hero_primary_button_type";
  ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "primary_button_type" SET DATA TYPE "public"."enum__pages_v_blocks_hero_primary_button_type" USING "primary_button_type"::"public"."enum__pages_v_blocks_hero_primary_button_type";
  ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "secondary_link_type" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "secondary_link_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum__pages_v_blocks_hero_secondary_link_type";
  CREATE TYPE "public"."enum__pages_v_blocks_hero_secondary_link_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "secondary_link_type" SET DEFAULT 'page'::"public"."enum__pages_v_blocks_hero_secondary_link_type";
  ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "secondary_link_type" SET DATA TYPE "public"."enum__pages_v_blocks_hero_secondary_link_type" USING "secondary_link_type"::"public"."enum__pages_v_blocks_hero_secondary_link_type";
  ALTER TABLE "_pages_v_blocks_cta_card_grid_cards" ALTER COLUMN "link_type" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_cta_card_grid_cards" ALTER COLUMN "link_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum__pages_v_blocks_cta_card_grid_cards_link_type";
  CREATE TYPE "public"."enum__pages_v_blocks_cta_card_grid_cards_link_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "_pages_v_blocks_cta_card_grid_cards" ALTER COLUMN "link_type" SET DEFAULT 'page'::"public"."enum__pages_v_blocks_cta_card_grid_cards_link_type";
  ALTER TABLE "_pages_v_blocks_cta_card_grid_cards" ALTER COLUMN "link_type" SET DATA TYPE "public"."enum__pages_v_blocks_cta_card_grid_cards_link_type" USING "link_type"::"public"."enum__pages_v_blocks_cta_card_grid_cards_link_type";
  ALTER TABLE "_pages_v_blocks_cta_card_grid" ALTER COLUMN "view_all_type" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_cta_card_grid" ALTER COLUMN "view_all_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum__pages_v_blocks_cta_card_grid_view_all_type";
  CREATE TYPE "public"."enum__pages_v_blocks_cta_card_grid_view_all_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "_pages_v_blocks_cta_card_grid" ALTER COLUMN "view_all_type" SET DEFAULT 'page'::"public"."enum__pages_v_blocks_cta_card_grid_view_all_type";
  ALTER TABLE "_pages_v_blocks_cta_card_grid" ALTER COLUMN "view_all_type" SET DATA TYPE "public"."enum__pages_v_blocks_cta_card_grid_view_all_type" USING "view_all_type"::"public"."enum__pages_v_blocks_cta_card_grid_view_all_type";
  ALTER TABLE "_pages_v_blocks_two_column" ALTER COLUMN "link_type" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_two_column" ALTER COLUMN "link_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum__pages_v_blocks_two_column_link_type";
  CREATE TYPE "public"."enum__pages_v_blocks_two_column_link_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "_pages_v_blocks_two_column" ALTER COLUMN "link_type" SET DEFAULT 'page'::"public"."enum__pages_v_blocks_two_column_link_type";
  ALTER TABLE "_pages_v_blocks_two_column" ALTER COLUMN "link_type" SET DATA TYPE "public"."enum__pages_v_blocks_two_column_link_type" USING "link_type"::"public"."enum__pages_v_blocks_two_column_link_type";
  ALTER TABLE "_pages_v_blocks_rate_table" ALTER COLUMN "button_type" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_rate_table" ALTER COLUMN "button_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum__pages_v_blocks_rate_table_button_type";
  CREATE TYPE "public"."enum__pages_v_blocks_rate_table_button_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "_pages_v_blocks_rate_table" ALTER COLUMN "button_type" SET DEFAULT 'page'::"public"."enum__pages_v_blocks_rate_table_button_type";
  ALTER TABLE "_pages_v_blocks_rate_table" ALTER COLUMN "button_type" SET DATA TYPE "public"."enum__pages_v_blocks_rate_table_button_type" USING "button_type"::"public"."enum__pages_v_blocks_rate_table_button_type";
  ALTER TABLE "_pages_v_blocks_team" ALTER COLUMN "action_type" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_team" ALTER COLUMN "action_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum__pages_v_blocks_team_action_type";
  CREATE TYPE "public"."enum__pages_v_blocks_team_action_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "_pages_v_blocks_team" ALTER COLUMN "action_type" SET DEFAULT 'page'::"public"."enum__pages_v_blocks_team_action_type";
  ALTER TABLE "_pages_v_blocks_team" ALTER COLUMN "action_type" SET DATA TYPE "public"."enum__pages_v_blocks_team_action_type" USING "action_type"::"public"."enum__pages_v_blocks_team_action_type";
  ALTER TABLE "_pages_v_blocks_team" ALTER COLUMN "view_all_type" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_team" ALTER COLUMN "view_all_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum__pages_v_blocks_team_view_all_type";
  CREATE TYPE "public"."enum__pages_v_blocks_team_view_all_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "_pages_v_blocks_team" ALTER COLUMN "view_all_type" SET DEFAULT 'page'::"public"."enum__pages_v_blocks_team_view_all_type";
  ALTER TABLE "_pages_v_blocks_team" ALTER COLUMN "view_all_type" SET DATA TYPE "public"."enum__pages_v_blocks_team_view_all_type" USING "view_all_type"::"public"."enum__pages_v_blocks_team_view_all_type";
  ALTER TABLE "_pages_v_blocks_membership_tiers" ALTER COLUMN "link_type" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_membership_tiers" ALTER COLUMN "link_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum__pages_v_blocks_membership_tiers_link_type";
  CREATE TYPE "public"."enum__pages_v_blocks_membership_tiers_link_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "_pages_v_blocks_membership_tiers" ALTER COLUMN "link_type" SET DEFAULT 'page'::"public"."enum__pages_v_blocks_membership_tiers_link_type";
  ALTER TABLE "_pages_v_blocks_membership_tiers" ALTER COLUMN "link_type" SET DATA TYPE "public"."enum__pages_v_blocks_membership_tiers_link_type" USING "link_type"::"public"."enum__pages_v_blocks_membership_tiers_link_type";
  ALTER TABLE "_pages_v_blocks_membership" ALTER COLUMN "action_type" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_membership" ALTER COLUMN "action_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum__pages_v_blocks_membership_action_type";
  CREATE TYPE "public"."enum__pages_v_blocks_membership_action_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "_pages_v_blocks_membership" ALTER COLUMN "action_type" SET DEFAULT 'page'::"public"."enum__pages_v_blocks_membership_action_type";
  ALTER TABLE "_pages_v_blocks_membership" ALTER COLUMN "action_type" SET DATA TYPE "public"."enum__pages_v_blocks_membership_action_type" USING "action_type"::"public"."enum__pages_v_blocks_membership_action_type";
  ALTER TABLE "_pages_v_blocks_membership" ALTER COLUMN "card_link_type" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_membership" ALTER COLUMN "card_link_type" SET DEFAULT 'page'::text;
  DROP TYPE "public"."enum__pages_v_blocks_membership_card_link_type";
  CREATE TYPE "public"."enum__pages_v_blocks_membership_card_link_type" AS ENUM('page', 'builtIn', 'url');
  ALTER TABLE "_pages_v_blocks_membership" ALTER COLUMN "card_link_type" SET DEFAULT 'page'::"public"."enum__pages_v_blocks_membership_card_link_type";
  ALTER TABLE "_pages_v_blocks_membership" ALTER COLUMN "card_link_type" SET DATA TYPE "public"."enum__pages_v_blocks_membership_card_link_type" USING "card_link_type"::"public"."enum__pages_v_blocks_membership_card_link_type";
  DROP INDEX "pages_blocks_hero_primary_button_primary_button_document_idx";
  DROP INDEX "pages_blocks_hero_secondary_link_secondary_link_document_idx";
  DROP INDEX "pages_blocks_cta_card_grid_cards_link_link_document_idx";
  DROP INDEX "pages_blocks_cta_card_grid_view_all_view_all_document_idx";
  DROP INDEX "pages_blocks_two_column_link_link_document_idx";
  DROP INDEX "pages_blocks_rate_table_button_button_document_idx";
  DROP INDEX "pages_blocks_team_action_action_document_idx";
  DROP INDEX "pages_blocks_team_view_all_view_all_document_idx";
  DROP INDEX "pages_blocks_membership_tiers_link_link_document_idx";
  DROP INDEX "pages_blocks_membership_action_action_document_idx";
  DROP INDEX "pages_blocks_membership_card_link_card_link_document_idx";
  DROP INDEX "_pages_v_blocks_hero_primary_button_primary_button_docum_idx";
  DROP INDEX "_pages_v_blocks_hero_secondary_link_secondary_link_docum_idx";
  DROP INDEX "_pages_v_blocks_cta_card_grid_cards_link_link_document_idx";
  DROP INDEX "_pages_v_blocks_cta_card_grid_view_all_view_all_document_idx";
  DROP INDEX "_pages_v_blocks_two_column_link_link_document_idx";
  DROP INDEX "_pages_v_blocks_rate_table_button_button_document_idx";
  DROP INDEX "_pages_v_blocks_team_action_action_document_idx";
  DROP INDEX "_pages_v_blocks_team_view_all_view_all_document_idx";
  DROP INDEX "_pages_v_blocks_membership_tiers_link_link_document_idx";
  DROP INDEX "_pages_v_blocks_membership_action_action_document_idx";
  DROP INDEX "_pages_v_blocks_membership_card_link_card_link_document_idx";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "primary_button_document_id";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "secondary_link_document_id";
  ALTER TABLE "pages_blocks_cta_card_grid_cards" DROP COLUMN "link_document_id";
  ALTER TABLE "pages_blocks_cta_card_grid" DROP COLUMN "view_all_document_id";
  ALTER TABLE "pages_blocks_two_column" DROP COLUMN "link_document_id";
  ALTER TABLE "pages_blocks_rate_table" DROP COLUMN "button_document_id";
  ALTER TABLE "pages_blocks_team" DROP COLUMN "action_document_id";
  ALTER TABLE "pages_blocks_team" DROP COLUMN "view_all_document_id";
  ALTER TABLE "pages_blocks_membership_tiers" DROP COLUMN "link_document_id";
  ALTER TABLE "pages_blocks_membership" DROP COLUMN "action_document_id";
  ALTER TABLE "pages_blocks_membership" DROP COLUMN "card_link_document_id";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "primary_button_document_id";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "secondary_link_document_id";
  ALTER TABLE "_pages_v_blocks_cta_card_grid_cards" DROP COLUMN "link_document_id";
  ALTER TABLE "_pages_v_blocks_cta_card_grid" DROP COLUMN "view_all_document_id";
  ALTER TABLE "_pages_v_blocks_two_column" DROP COLUMN "link_document_id";
  ALTER TABLE "_pages_v_blocks_rate_table" DROP COLUMN "button_document_id";
  ALTER TABLE "_pages_v_blocks_team" DROP COLUMN "action_document_id";
  ALTER TABLE "_pages_v_blocks_team" DROP COLUMN "view_all_document_id";
  ALTER TABLE "_pages_v_blocks_membership_tiers" DROP COLUMN "link_document_id";
  ALTER TABLE "_pages_v_blocks_membership" DROP COLUMN "action_document_id";
  ALTER TABLE "_pages_v_blocks_membership" DROP COLUMN "card_link_document_id";
  DROP TYPE "public"."enum_pages_blocks_rich_text_buttons_link_type";
  DROP TYPE "public"."enum_pages_blocks_rich_text_buttons_link_built_in";
  DROP TYPE "public"."enum__pages_v_blocks_rich_text_buttons_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_rich_text_buttons_link_built_in";`)
}
