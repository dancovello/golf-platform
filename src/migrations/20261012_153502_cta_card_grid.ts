import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_cta_card_grid_cards_link_type" AS ENUM('page', 'url');
  CREATE TYPE "public"."enum_pages_blocks_cta_card_grid_style" AS ENUM('editorial', 'immersive', 'index');
  CREATE TYPE "public"."enum_pages_blocks_cta_card_grid_view_all_type" AS ENUM('page', 'url');
  CREATE TABLE "pages_blocks_cta_card_grid_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"eyebrow" varchar,
  	"image_id" uuid NOT NULL,
  	"link_type" "enum_pages_blocks_cta_card_grid_cards_link_type" DEFAULT 'page',
  	"link_page_id" uuid,
  	"link_url" varchar
  );
  
  CREATE TABLE "pages_blocks_cta_card_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_cta_card_grid_style" DEFAULT 'editorial' NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar NOT NULL,
  	"intro" varchar,
  	"view_all_label" varchar,
  	"view_all_type" "enum_pages_blocks_cta_card_grid_view_all_type" DEFAULT 'page',
  	"view_all_page_id" uuid,
  	"view_all_url" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_cta_card_grid_cards" ADD CONSTRAINT "pages_blocks_cta_card_grid_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_card_grid_cards" ADD CONSTRAINT "pages_blocks_cta_card_grid_cards_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_card_grid_cards" ADD CONSTRAINT "pages_blocks_cta_card_grid_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta_card_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_card_grid" ADD CONSTRAINT "pages_blocks_cta_card_grid_view_all_page_id_pages_id_fk" FOREIGN KEY ("view_all_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_card_grid" ADD CONSTRAINT "pages_blocks_cta_card_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_cta_card_grid_cards_order_idx" ON "pages_blocks_cta_card_grid_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_card_grid_cards_parent_id_idx" ON "pages_blocks_cta_card_grid_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_card_grid_cards_image_idx" ON "pages_blocks_cta_card_grid_cards" USING btree ("image_id");
  CREATE INDEX "pages_blocks_cta_card_grid_cards_link_link_page_idx" ON "pages_blocks_cta_card_grid_cards" USING btree ("link_page_id");
  CREATE INDEX "pages_blocks_cta_card_grid_order_idx" ON "pages_blocks_cta_card_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_card_grid_parent_id_idx" ON "pages_blocks_cta_card_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_card_grid_path_idx" ON "pages_blocks_cta_card_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_card_grid_view_all_view_all_page_idx" ON "pages_blocks_cta_card_grid" USING btree ("view_all_page_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_cta_card_grid_cards" CASCADE;
  DROP TABLE "pages_blocks_cta_card_grid" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_cta_card_grid_cards_link_type";
  DROP TYPE "public"."enum_pages_blocks_cta_card_grid_style";
  DROP TYPE "public"."enum_pages_blocks_cta_card_grid_view_all_type";`)
}
