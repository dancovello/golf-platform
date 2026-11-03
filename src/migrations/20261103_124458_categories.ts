import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Every club gets the six categories news has always had, so nothing changes until an editor
  // changes them. Each existing article and "Latest news" block is then pointed at its club's
  // matching category, and only after that is the old fixed list dropped.
  await db.execute(sql`
   CREATE TABLE "categories" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "pages_blocks_news_feed" ADD COLUMN "category_id" uuid;
  ALTER TABLE "_pages_v_blocks_news_feed" ADD COLUMN "category_id" uuid;
  ALTER TABLE "news" ADD COLUMN "category_id" uuid;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
  CREATE INDEX "categories_tenant_idx" ON "categories" USING btree ("tenant_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "tenant_slug_2_idx" ON "categories" USING btree ("tenant_id","slug");
  ALTER TABLE "pages_blocks_news_feed" ADD CONSTRAINT "pages_blocks_news_feed_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_news_feed" ADD CONSTRAINT "_pages_v_blocks_news_feed_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_news_feed_category_idx" ON "pages_blocks_news_feed" USING btree ("category_id");
  CREATE INDEX "_pages_v_blocks_news_feed_category_idx" ON "_pages_v_blocks_news_feed" USING btree ("category_id");
  CREATE INDEX "news_category_idx" ON "news" USING btree ("category_id");

  INSERT INTO "categories" ("tenant_id", "name", "slug", "created_at")
  SELECT t."id", c."name", c."slug", now() + c."position" * interval '1 millisecond'
  FROM "tenants" t
  CROSS JOIN (VALUES
    (1, 'Course news', 'course'),
    (2, 'Competitions', 'competitions'),
    (3, 'Clubhouse', 'clubhouse'),
    (4, 'Membership', 'membership'),
    (5, 'Academy', 'academy'),
    (6, 'Club news', 'club')
  ) AS c("position", "name", "slug");

  UPDATE "news" n SET "category_id" = c."id"
  FROM "categories" c
  WHERE c."tenant_id" = n."tenant_id" AND c."slug" = n."category"::text;

  UPDATE "pages_blocks_news_feed" b SET "category_id" = c."id"
  FROM "pages" p, "categories" c
  WHERE p."id" = b."_parent_id" AND c."tenant_id" = p."tenant_id" AND c."slug" = b."category"::text;

  UPDATE "_pages_v_blocks_news_feed" b SET "category_id" = c."id"
  FROM "_pages_v" v, "categories" c
  WHERE v."id" = b."_parent_id" AND c."tenant_id" = v."version_tenant_id" AND c."slug" = b."category"::text;

  ALTER TABLE "news" ALTER COLUMN "category_id" SET NOT NULL;
  ALTER TABLE "pages_blocks_news_feed" DROP COLUMN "category";
  ALTER TABLE "_pages_v_blocks_news_feed" DROP COLUMN "category";
  ALTER TABLE "news" DROP COLUMN "category";
  DROP TYPE "public"."enum_pages_blocks_news_feed_category";
  DROP TYPE "public"."enum__pages_v_blocks_news_feed_category";
  DROP TYPE "public"."enum_news_category";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Back to the fixed list: a category that isn't one of the original six becomes "club".
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_news_feed_category" AS ENUM('course', 'competitions', 'clubhouse', 'membership', 'academy', 'club');
  CREATE TYPE "public"."enum__pages_v_blocks_news_feed_category" AS ENUM('course', 'competitions', 'clubhouse', 'membership', 'academy', 'club');
  CREATE TYPE "public"."enum_news_category" AS ENUM('course', 'competitions', 'clubhouse', 'membership', 'academy', 'club');
  ALTER TABLE "pages_blocks_news_feed" ADD COLUMN "category" "enum_pages_blocks_news_feed_category";
  ALTER TABLE "_pages_v_blocks_news_feed" ADD COLUMN "category" "enum__pages_v_blocks_news_feed_category";
  ALTER TABLE "news" ADD COLUMN "category" "enum_news_category" DEFAULT 'club' NOT NULL;

  UPDATE "news" n SET "category" = (CASE WHEN c."slug" IN ('course', 'competitions', 'clubhouse', 'membership', 'academy') THEN c."slug" ELSE 'club' END)::"enum_news_category"
  FROM "categories" c WHERE c."id" = n."category_id";
  UPDATE "pages_blocks_news_feed" b SET "category" = (CASE WHEN c."slug" IN ('course', 'competitions', 'clubhouse', 'membership', 'academy') THEN c."slug" ELSE 'club' END)::"enum_pages_blocks_news_feed_category"
  FROM "categories" c WHERE c."id" = b."category_id";
  UPDATE "_pages_v_blocks_news_feed" b SET "category" = (CASE WHEN c."slug" IN ('course', 'competitions', 'clubhouse', 'membership', 'academy') THEN c."slug" ELSE 'club' END)::"enum__pages_v_blocks_news_feed_category"
  FROM "categories" c WHERE c."id" = b."category_id";

  ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "categories" CASCADE;
  DROP INDEX "pages_blocks_news_feed_category_idx";
  DROP INDEX "_pages_v_blocks_news_feed_category_idx";
  DROP INDEX "news_category_idx";
  ALTER TABLE "pages_blocks_news_feed" DROP COLUMN "category_id";
  ALTER TABLE "_pages_v_blocks_news_feed" DROP COLUMN "category_id";
  ALTER TABLE "news" DROP COLUMN "category_id";`)
}
