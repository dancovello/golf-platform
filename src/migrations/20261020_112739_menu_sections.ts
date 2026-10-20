import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_club_settings_header_menu_links_link_type" AS ENUM('page', 'builtIn', 'url');
  CREATE TYPE "public"."enum_club_settings_header_menu_links_link_built_in" AS ENUM('news', 'events', 'contact', 'privacy');
  CREATE TABLE "club_settings_header_menu_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"page_id" uuid
  );
  
  CREATE TABLE "club_settings_header_menu_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_label" varchar,
  	"link_type" "enum_club_settings_header_menu_links_link_type" DEFAULT 'page',
  	"link_page_id" uuid,
  	"link_built_in" "enum_club_settings_header_menu_links_link_built_in",
  	"link_url" varchar
  );
  
  ALTER TABLE "club_settings_header_menu" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "club_settings_header_menu" ALTER COLUMN "kind" SET DEFAULT 'link';
  ALTER TABLE "club_settings_footer_legal_links" ALTER COLUMN "link_label" DROP NOT NULL;
  ALTER TABLE "club_settings_header_menu_sections" ADD CONSTRAINT "club_settings_header_menu_sections_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "club_settings_header_menu_sections" ADD CONSTRAINT "club_settings_header_menu_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."club_settings_header_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "club_settings_header_menu_links" ADD CONSTRAINT "club_settings_header_menu_links_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "club_settings_header_menu_links" ADD CONSTRAINT "club_settings_header_menu_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."club_settings_header_menu"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "club_settings_header_menu_sections_order_idx" ON "club_settings_header_menu_sections" USING btree ("_order");
  CREATE INDEX "club_settings_header_menu_sections_parent_id_idx" ON "club_settings_header_menu_sections" USING btree ("_parent_id");
  CREATE INDEX "club_settings_header_menu_sections_page_idx" ON "club_settings_header_menu_sections" USING btree ("page_id");
  CREATE INDEX "club_settings_header_menu_links_order_idx" ON "club_settings_header_menu_links" USING btree ("_order");
  CREATE INDEX "club_settings_header_menu_links_parent_id_idx" ON "club_settings_header_menu_links" USING btree ("_parent_id");
  CREATE INDEX "club_settings_header_menu_links_link_link_page_idx" ON "club_settings_header_menu_links" USING btree ("link_page_id");`)

  // Existing menus, copied into the new lists (Dan 2026-10-20). Nothing is deleted: the old
  // "page" and "groups" stay in place, hidden, and the website falls back to them if a new
  // list is empty. Row IDs are new random 24-character strings, like the ones Payload makes.
  await db.execute(sql`
  -- A drop-down of one page's child pages: that page becomes the first "Pages in the drop-down".
  INSERT INTO "club_settings_header_menu_sections" ("_order", "_parent_id", "id", "page_id")
  SELECT 1, m."id", substr(md5(random()::text || m."id"), 1, 24), m."page_id"
  FROM "club_settings_header_menu" m
  WHERE m."kind" = 'children' AND m."page_id" IS NOT NULL;

  -- Every group's links, in order, become the one "Links" list (the website already showed
  -- them as one list; the group headings were never shown).
  INSERT INTO "club_settings_header_menu_links"
    ("_order", "_parent_id", "id", "link_label", "link_type", "link_page_id", "link_built_in", "link_url")
  SELECT
    row_number() OVER (PARTITION BY g."_parent_id" ORDER BY g."_order", l."_order"),
    g."_parent_id",
    substr(md5(random()::text || l."id"), 1, 24),
    l."link_label",
    l."link_type"::text::"enum_club_settings_header_menu_links_link_type",
    l."link_page_id",
    l."link_built_in"::text::"enum_club_settings_header_menu_links_link_built_in",
    l."link_url"
  FROM "club_settings_header_menu_groups" g
  JOIN "club_settings_header_menu_groups_links" l ON l."_parent_id" = g."id"
  JOIN "club_settings_header_menu" m ON m."id" = g."_parent_id"
  -- Items saved before "What it does" existed (blank) were drop-downs when they had groups.
  WHERE m."kind" = 'manual' OR m."kind" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "club_settings_header_menu_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "club_settings_header_menu_links" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "club_settings_header_menu_sections" CASCADE;
  DROP TABLE "club_settings_header_menu_links" CASCADE;
  UPDATE "club_settings_header_menu" SET "label" = '' WHERE "label" IS NULL;
  ALTER TABLE "club_settings_header_menu" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "club_settings_header_menu" ALTER COLUMN "kind" DROP DEFAULT;
  UPDATE "club_settings_footer_legal_links" SET "link_label" = '' WHERE "link_label" IS NULL;
  ALTER TABLE "club_settings_footer_legal_links" ALTER COLUMN "link_label" SET NOT NULL;
  DROP TYPE "public"."enum_club_settings_header_menu_links_link_type";
  DROP TYPE "public"."enum_club_settings_header_menu_links_link_built_in";`)
}
