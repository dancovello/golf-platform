import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_news_feed_style" AS ENUM('carousel', 'leadList', 'headlines');
  CREATE TYPE "public"."enum_pages_blocks_news_feed_category" AS ENUM('course', 'competitions', 'clubhouse', 'membership', 'academy', 'club');
  CREATE TABLE "pages_blocks_news_feed" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_news_feed_style" DEFAULT 'carousel' NOT NULL,
  	"eyebrow" varchar DEFAULT 'News',
  	"heading" varchar NOT NULL,
  	"category" "enum_pages_blocks_news_feed_category",
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_news_feed" ADD CONSTRAINT "pages_blocks_news_feed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_news_feed_order_idx" ON "pages_blocks_news_feed" USING btree ("_order");
  CREATE INDEX "pages_blocks_news_feed_parent_id_idx" ON "pages_blocks_news_feed" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_news_feed_path_idx" ON "pages_blocks_news_feed" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_news_feed" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_news_feed_style";
  DROP TYPE "public"."enum_pages_blocks_news_feed_category";`)
}
