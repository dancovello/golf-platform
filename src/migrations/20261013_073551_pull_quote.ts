import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_pull_quote_style" AS ENUM('centred', 'overImage', 'split');
  CREATE TABLE "pages_blocks_pull_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_pull_quote_style" DEFAULT 'centred' NOT NULL,
  	"quote" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar,
  	"publication" varchar,
  	"year" varchar,
  	"image_id" uuid,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_pull_quote" ADD CONSTRAINT "pages_blocks_pull_quote_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_pull_quote" ADD CONSTRAINT "pages_blocks_pull_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_pull_quote_order_idx" ON "pages_blocks_pull_quote" USING btree ("_order");
  CREATE INDEX "pages_blocks_pull_quote_parent_id_idx" ON "pages_blocks_pull_quote" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_pull_quote_path_idx" ON "pages_blocks_pull_quote" USING btree ("_path");
  CREATE INDEX "pages_blocks_pull_quote_image_idx" ON "pages_blocks_pull_quote" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_pull_quote" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_pull_quote_style";`)
}
