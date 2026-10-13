import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_map_routes_mode" AS ENUM('car', 'train', 'air', 'bus', 'walk');
  CREATE TYPE "public"."enum_pages_blocks_map_style" AS ENUM('split', 'fullBleed', 'gettingHere');
  CREATE TABLE "pages_blocks_map_routes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "enum_pages_blocks_map_routes_mode",
  	"distance" varchar,
  	"directions" varchar
  );
  
  CREATE TABLE "pages_blocks_map" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_map_style" DEFAULT 'split' NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar NOT NULL,
  	"block_name" varchar
  );
  
  ALTER TABLE "club_settings" ADD COLUMN "location_latitude" numeric;
  ALTER TABLE "club_settings" ADD COLUMN "location_longitude" numeric;
  ALTER TABLE "club_settings" ADD COLUMN "location_map_label" varchar;
  ALTER TABLE "club_settings" ADD COLUMN "location_what3words" varchar;
  ALTER TABLE "pages_blocks_map_routes" ADD CONSTRAINT "pages_blocks_map_routes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_map"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_map" ADD CONSTRAINT "pages_blocks_map_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_map_routes_order_idx" ON "pages_blocks_map_routes" USING btree ("_order");
  CREATE INDEX "pages_blocks_map_routes_parent_id_idx" ON "pages_blocks_map_routes" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_map_order_idx" ON "pages_blocks_map" USING btree ("_order");
  CREATE INDEX "pages_blocks_map_parent_id_idx" ON "pages_blocks_map" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_map_path_idx" ON "pages_blocks_map" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_map_routes" CASCADE;
  DROP TABLE "pages_blocks_map" CASCADE;
  ALTER TABLE "club_settings" DROP COLUMN "location_latitude";
  ALTER TABLE "club_settings" DROP COLUMN "location_longitude";
  ALTER TABLE "club_settings" DROP COLUMN "location_map_label";
  ALTER TABLE "club_settings" DROP COLUMN "location_what3words";
  DROP TYPE "public"."enum_pages_blocks_map_routes_mode";
  DROP TYPE "public"."enum_pages_blocks_map_style";`)
}
