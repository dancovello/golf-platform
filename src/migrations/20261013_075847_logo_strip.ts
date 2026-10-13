import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_logo_strip_style" AS ENUM('row', 'grid', 'marquee');
  CREATE TABLE "pages_blocks_logo_strip_partners" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"url" varchar,
  	"logo_id" uuid
  );
  
  CREATE TABLE "pages_blocks_logo_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_logo_strip_style" DEFAULT 'row' NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_logo_strip_partners" ADD CONSTRAINT "pages_blocks_logo_strip_partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_strip_partners" ADD CONSTRAINT "pages_blocks_logo_strip_partners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_logo_strip"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_logo_strip" ADD CONSTRAINT "pages_blocks_logo_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_logo_strip_partners_order_idx" ON "pages_blocks_logo_strip_partners" USING btree ("_order");
  CREATE INDEX "pages_blocks_logo_strip_partners_parent_id_idx" ON "pages_blocks_logo_strip_partners" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_logo_strip_partners_logo_idx" ON "pages_blocks_logo_strip_partners" USING btree ("logo_id");
  CREATE INDEX "pages_blocks_logo_strip_order_idx" ON "pages_blocks_logo_strip" USING btree ("_order");
  CREATE INDEX "pages_blocks_logo_strip_parent_id_idx" ON "pages_blocks_logo_strip" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_logo_strip_path_idx" ON "pages_blocks_logo_strip" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_logo_strip_partners" CASCADE;
  DROP TABLE "pages_blocks_logo_strip" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_logo_strip_style";`)
}
