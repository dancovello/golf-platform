import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_events_feed_style" AS ENUM('carousel', 'agenda', 'featured');
  CREATE TYPE "public"."enum_pages_blocks_events_feed_category" AS ENUM('social', 'dining', 'competition', 'academy', 'members');
  CREATE TABLE "pages_blocks_events_feed" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_events_feed_style" DEFAULT 'carousel' NOT NULL,
  	"eyebrow" varchar DEFAULT 'What’s on',
  	"heading" varchar NOT NULL,
  	"intro" varchar,
  	"category" "enum_pages_blocks_events_feed_category",
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_events_feed" ADD CONSTRAINT "pages_blocks_events_feed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_events_feed_order_idx" ON "pages_blocks_events_feed" USING btree ("_order");
  CREATE INDEX "pages_blocks_events_feed_parent_id_idx" ON "pages_blocks_events_feed" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_events_feed_path_idx" ON "pages_blocks_events_feed" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_events_feed" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_events_feed_style";
  DROP TYPE "public"."enum_pages_blocks_events_feed_category";`)
}
