import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_club_settings_branding_font_set" AS ENUM('heritage', 'editorial', 'contemporary');
  ALTER TABLE "tenants" ADD COLUMN "slug" varchar;
  ALTER TABLE "club_settings" ADD COLUMN "branding_primary" varchar DEFAULT '#1B2A22' NOT NULL;
  ALTER TABLE "club_settings" ADD COLUMN "branding_secondary" varchar DEFAULT '#717E6A' NOT NULL;
  ALTER TABLE "club_settings" ADD COLUMN "branding_accent" varchar DEFAULT '#B39462' NOT NULL;
  ALTER TABLE "club_settings" ADD COLUMN "branding_light" varchar DEFAULT '#FAF7F1' NOT NULL;
  ALTER TABLE "club_settings" ADD COLUMN "branding_dark" varchar DEFAULT '#111814' NOT NULL;
  ALTER TABLE "club_settings" ADD COLUMN "branding_font_set" "enum_club_settings_branding_font_set" DEFAULT 'heritage' NOT NULL;
  CREATE UNIQUE INDEX "tenants_slug_idx" ON "tenants" USING btree ("slug");`)

  // Hand-written. Existing clubs get a short name from their club name (the app does the same
  // for new clubs), with -2, -3… if two names would clash. Then the short name is compulsory.
  await db.execute(sql`
  UPDATE "tenants" t SET "slug" = s.slug FROM (
    SELECT id, CASE WHEN n = 1 THEN base ELSE base || '-' || n END AS slug FROM (
      SELECT id, base, row_number() OVER (PARTITION BY base ORDER BY created_at, id) AS n FROM (
        SELECT id, created_at,
          COALESCE(NULLIF(trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), ''), 'club') AS base
        FROM "tenants"
      ) named
    ) numbered
  ) s WHERE t.id = s.id;
  ALTER TABLE "tenants" ALTER COLUMN "slug" SET NOT NULL;`)

  // Hand-written. The database itself refuses a malformed short name or colour, whatever
  // writes it. Colours reach the page's CSS, so this backs up the app's own checks.
  await db.execute(sql`
  ALTER TABLE "tenants" ADD CONSTRAINT "tenants_slug_format" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  ALTER TABLE "club_settings" ADD CONSTRAINT "club_settings_branding_colours" CHECK (
    "branding_primary" ~ '^#[0-9A-Fa-f]{6}$' AND "branding_secondary" ~ '^#[0-9A-Fa-f]{6}$'
    AND "branding_accent" ~ '^#[0-9A-Fa-f]{6}$' AND "branding_light" ~ '^#[0-9A-Fa-f]{6}$'
    AND "branding_dark" ~ '^#[0-9A-Fa-f]{6}$');`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "club_settings" DROP CONSTRAINT "club_settings_branding_colours";
  ALTER TABLE "tenants" DROP CONSTRAINT "tenants_slug_format";
  DROP INDEX "tenants_slug_idx";
  ALTER TABLE "tenants" DROP COLUMN "slug";
  ALTER TABLE "club_settings" DROP COLUMN "branding_primary";
  ALTER TABLE "club_settings" DROP COLUMN "branding_secondary";
  ALTER TABLE "club_settings" DROP COLUMN "branding_accent";
  ALTER TABLE "club_settings" DROP COLUMN "branding_light";
  ALTER TABLE "club_settings" DROP COLUMN "branding_dark";
  ALTER TABLE "club_settings" DROP COLUMN "branding_font_set";
  DROP TYPE "public"."enum_club_settings_branding_font_set";`)
}
