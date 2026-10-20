import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "media" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"alt" varchar NOT NULL,
  	"prefix" varchar NOT NULL,
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "media" ADD CONSTRAINT "media_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
  CREATE UNIQUE INDEX "media_filename_compound_idx" ON "media" USING btree ("filename","prefix");
  CREATE INDEX "media_tenant_idx" ON "media" USING btree ("tenant_id");
  CREATE UNIQUE INDEX "media_prefix_idx" ON "media" USING btree ("prefix");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE INDEX "media_filename_idx" ON "media" USING btree ("filename");`)

  // Hand-written (edits above: tenant_id and prefix NOT NULL, ON DELETE restrict). Every file
  // belongs to a club; a club can't be deleted while it has files; each file's folder is
  // "media/" plus a random ID, so its address can't be guessed (src/media/storage.ts).
  await db.execute(sql`
  ALTER TABLE "media" ADD CONSTRAINT "media_prefix_format" CHECK (
    "prefix" ~ '^media/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "media" CASCADE;`)
}
