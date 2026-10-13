import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_team_style" AS ENUM('grid', 'directory', 'featured');
  CREATE TYPE "public"."enum_pages_blocks_team_action_type" AS ENUM('page', 'url');
  CREATE TYPE "public"."enum_pages_blocks_team_view_all_type" AS ENUM('page', 'url');
  CREATE TYPE "public"."enum_staff_department" AS ENUM('golf', 'course', 'club', 'clubhouse', 'committee');
  CREATE TABLE "pages_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_pages_blocks_team_style" DEFAULT 'grid' NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar NOT NULL,
  	"featured_id" uuid,
  	"action_label" varchar,
  	"action_type" "enum_pages_blocks_team_action_type" DEFAULT 'page',
  	"action_page_id" uuid,
  	"action_url" varchar,
  	"view_all_label" varchar,
  	"view_all_type" "enum_pages_blocks_team_view_all_type" DEFAULT 'page',
  	"view_all_page_id" uuid,
  	"view_all_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "staff" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"tenant_id" uuid NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar NOT NULL,
  	"department" "enum_staff_department" DEFAULT 'golf' NOT NULL,
  	"qualification" varchar,
  	"photo_id" uuid,
  	"bio" varchar,
  	"email" varchar,
  	"phone" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "pages_rels" ADD COLUMN "staff_id" uuid;
  ALTER TABLE "pages_blocks_team" ADD CONSTRAINT "pages_blocks_team_featured_id_staff_id_fk" FOREIGN KEY ("featured_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_team" ADD CONSTRAINT "pages_blocks_team_action_page_id_pages_id_fk" FOREIGN KEY ("action_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_team" ADD CONSTRAINT "pages_blocks_team_view_all_page_id_pages_id_fk" FOREIGN KEY ("view_all_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_team" ADD CONSTRAINT "pages_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "staff" ADD CONSTRAINT "staff_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "staff" ADD CONSTRAINT "staff_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_team_order_idx" ON "pages_blocks_team" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_parent_id_idx" ON "pages_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_path_idx" ON "pages_blocks_team" USING btree ("_path");
  CREATE INDEX "pages_blocks_team_featured_idx" ON "pages_blocks_team" USING btree ("featured_id");
  CREATE INDEX "pages_blocks_team_action_action_page_idx" ON "pages_blocks_team" USING btree ("action_page_id");
  CREATE INDEX "pages_blocks_team_view_all_view_all_page_idx" ON "pages_blocks_team" USING btree ("view_all_page_id");
  CREATE INDEX "staff_tenant_idx" ON "staff" USING btree ("tenant_id");
  CREATE INDEX "staff_photo_idx" ON "staff" USING btree ("photo_id");
  CREATE INDEX "staff_updated_at_idx" ON "staff" USING btree ("updated_at");
  CREATE INDEX "staff_created_at_idx" ON "staff" USING btree ("created_at");
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_staff_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_rels_staff_id_idx" ON "pages_rels" USING btree ("staff_id");`)

  // Hand-edited above: staff.tenant_id NOT NULL and ON DELETE restrict. Every team member
  // belongs to a club, and a club can't be deleted while it has team members.
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "staff" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_team" CASCADE;
  DROP TABLE "staff" CASCADE;
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_staff_fk";
  
  DROP INDEX "pages_rels_staff_id_idx";
  ALTER TABLE "pages_rels" DROP COLUMN "staff_id";
  DROP TYPE "public"."enum_pages_blocks_team_style";
  DROP TYPE "public"."enum_pages_blocks_team_action_type";
  DROP TYPE "public"."enum_pages_blocks_team_view_all_type";
  DROP TYPE "public"."enum_staff_department";`)
}
