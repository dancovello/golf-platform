import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_events_category" AS ENUM('social', 'dining', 'competition', 'academy', 'members');
  CREATE TYPE "public"."enum_events_booking" AS ENUM('book', 'enquire', 'soldOut');
  CREATE TYPE "public"."enum_events_link_type" AS ENUM('page', 'url');
  CREATE TABLE "events" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"title" varchar NOT NULL,
  	"status" "enum_events_status" DEFAULT 'draft' NOT NULL,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"category" "enum_events_category" DEFAULT 'social' NOT NULL,
  	"venue" varchar,
  	"time_note" varchar,
  	"summary" varchar,
  	"image_id" uuid,
  	"price" varchar,
  	"member_price" varchar,
  	"booking" "enum_events_booking" DEFAULT 'book' NOT NULL,
  	"capacity" numeric,
  	"places_left" numeric,
  	"link_type" "enum_events_link_type" DEFAULT 'page',
  	"link_page_id" uuid,
  	"link_url" varchar,
  	"featured" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "events" ADD CONSTRAINT "events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "events_tenant_idx" ON "events" USING btree ("tenant_id");
  CREATE INDEX "events_image_idx" ON "events" USING btree ("image_id");
  CREATE INDEX "events_link_link_page_idx" ON "events" USING btree ("link_page_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");`)

  // Hand-edited above: events.tenant_id NOT NULL and ON DELETE restrict. Every event belongs
  // to a club, and a club can't be deleted while it has events.
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "events" CASCADE;
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum_events_category";
  DROP TYPE "public"."enum_events_booking";
  DROP TYPE "public"."enum_events_link_type";`)
}
