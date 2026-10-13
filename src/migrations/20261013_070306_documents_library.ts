import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_documents_category" AS ENUM('course', 'policies', 'forms', 'minutes', 'visitors', 'other');
  CREATE TABLE "documents" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"title" varchar NOT NULL,
  	"category" "enum_documents_category" DEFAULT 'other' NOT NULL,
  	"last_reviewed" timestamp(3) with time zone,
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
  
  ALTER TABLE "documents" ADD CONSTRAINT "documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
  CREATE UNIQUE INDEX "documents_filename_compound_idx" ON "documents" USING btree ("filename","prefix");
  CREATE INDEX "documents_tenant_idx" ON "documents" USING btree ("tenant_id");
  CREATE UNIQUE INDEX "documents_prefix_idx" ON "documents" USING btree ("prefix");
  CREATE INDEX "documents_updated_at_idx" ON "documents" USING btree ("updated_at");
  CREATE INDEX "documents_created_at_idx" ON "documents" USING btree ("created_at");
  CREATE INDEX "documents_filename_idx" ON "documents" USING btree ("filename");`)

  // Hand-written (edits above: tenant_id and prefix NOT NULL, ON DELETE restrict). Every
  // document belongs to a club; a club can't be deleted while it has documents; each file's
  // folder is "documents/" plus a random ID (src/media/folders.ts).
  await db.execute(sql`
  ALTER TABLE "documents" ADD CONSTRAINT "documents_prefix_format" CHECK (
    "prefix" ~ '^documents/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "documents" CASCADE;
  DROP TYPE "public"."enum_documents_category";`)
}
