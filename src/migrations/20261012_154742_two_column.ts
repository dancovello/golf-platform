import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_two_column_style" AS ENUM('split', 'collage', 'keyFacts');
  CREATE TYPE "public"."enum_pages_blocks_two_column_image_side" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_pages_blocks_two_column_tone" AS ENUM('canvas', 'brand');
  CREATE TYPE "public"."enum_pages_blocks_two_column_link_type" AS ENUM('page', 'url');
  CREATE TABLE "pages_blocks_two_column_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar
  );
  
  CREATE TABLE "pages_blocks_two_column" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_two_column_style" DEFAULT 'split' NOT NULL,
  	"image_side" "enum_pages_blocks_two_column_image_side" DEFAULT 'left',
  	"tone" "enum_pages_blocks_two_column_tone" DEFAULT 'canvas',
  	"image_id" uuid NOT NULL,
  	"inset_image_id" uuid,
  	"eyebrow" varchar,
  	"heading" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"link_label" varchar,
  	"link_type" "enum_pages_blocks_two_column_link_type" DEFAULT 'page',
  	"link_page_id" uuid,
  	"link_url" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_two_column_facts" ADD CONSTRAINT "pages_blocks_two_column_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_two_column"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_two_column" ADD CONSTRAINT "pages_blocks_two_column_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_two_column" ADD CONSTRAINT "pages_blocks_two_column_inset_image_id_media_id_fk" FOREIGN KEY ("inset_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_two_column" ADD CONSTRAINT "pages_blocks_two_column_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_two_column" ADD CONSTRAINT "pages_blocks_two_column_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_two_column_facts_order_idx" ON "pages_blocks_two_column_facts" USING btree ("_order");
  CREATE INDEX "pages_blocks_two_column_facts_parent_id_idx" ON "pages_blocks_two_column_facts" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_two_column_order_idx" ON "pages_blocks_two_column" USING btree ("_order");
  CREATE INDEX "pages_blocks_two_column_parent_id_idx" ON "pages_blocks_two_column" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_two_column_path_idx" ON "pages_blocks_two_column" USING btree ("_path");
  CREATE INDEX "pages_blocks_two_column_image_idx" ON "pages_blocks_two_column" USING btree ("image_id");
  CREATE INDEX "pages_blocks_two_column_inset_image_idx" ON "pages_blocks_two_column" USING btree ("inset_image_id");
  CREATE INDEX "pages_blocks_two_column_link_link_page_idx" ON "pages_blocks_two_column" USING btree ("link_page_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_two_column_facts" CASCADE;
  DROP TABLE "pages_blocks_two_column" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_two_column_style";
  DROP TYPE "public"."enum_pages_blocks_two_column_image_side";
  DROP TYPE "public"."enum_pages_blocks_two_column_tone";
  DROP TYPE "public"."enum_pages_blocks_two_column_link_type";`)
}
