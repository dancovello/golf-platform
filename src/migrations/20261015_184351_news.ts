import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_news_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_news_category" AS ENUM('course', 'competitions', 'clubhouse', 'membership', 'academy', 'club');
  CREATE TABLE "news" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"title" varchar NOT NULL,
  	"status" "enum_news_status" DEFAULT 'draft' NOT NULL,
  	"published_at" timestamp(3) with time zone NOT NULL,
  	"category" "enum_news_category" DEFAULT 'club' NOT NULL,
  	"excerpt" varchar,
  	"image_id" uuid,
  	"image_caption" varchar,
  	"author" varchar,
  	"body" jsonb,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "news" ADD CONSTRAINT "news_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "news_tenant_idx" ON "news" USING btree ("tenant_id");
  CREATE INDEX "news_image_idx" ON "news" USING btree ("image_id");
  CREATE INDEX "news_slug_idx" ON "news" USING btree ("slug");
  CREATE INDEX "news_updated_at_idx" ON "news" USING btree ("updated_at");
  CREATE INDEX "news_created_at_idx" ON "news" USING btree ("created_at");
  CREATE UNIQUE INDEX "tenant_slug_1_idx" ON "news" USING btree ("tenant_id","slug");`)

  // Hand-edited above: news.tenant_id NOT NULL and ON DELETE restrict. Every article belongs
  // to a club, and a club can't be deleted while it has articles.
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "news" CASCADE;
  DROP TYPE "public"."enum_news_status";
  DROP TYPE "public"."enum_news_category";`)
}
