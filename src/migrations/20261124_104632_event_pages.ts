import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Event pages (24 Nov 2026): each event gets a write-up and a web address, /events/<address>,
 * unique within its club. New columns only; nothing changed or deleted.
 *
 * Existing events get an address the same way new ones do (src/collections/eventSlug.ts): the
 * title in lower case with dashes, plus the year (UK time) unless the title already has it, at
 * most 80 long. Where two of a club's events would share one, the later ones get "-2", "-3" ….
 * (Accented letters are dropped here rather than plain-lettered; an editor can change any
 * address.) This runs before the unique index, so the index can always be built.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "events" ADD COLUMN "body" jsonb;
  ALTER TABLE "events" ADD COLUMN "slug" varchar;

  WITH words AS (
    SELECT
      id,
      tenant_id,
      starts_at,
      trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')) AS w,
      to_char(starts_at AT TIME ZONE 'Europe/London', 'YYYY') AS y
    FROM "events"
  ),
  base AS (
    SELECT
      id,
      tenant_id,
      starts_at,
      coalesce(
        nullif(
          rtrim(
            left(
              CASE WHEN y = ANY (string_to_array(w, '-')) THEN w
                   WHEN w = '' THEN y
                   ELSE w || '-' || y END,
              80
            ),
            '-'
          ),
          ''
        ),
        'event'
      ) AS b
    FROM words
  ),
  numbered AS (
    SELECT id, b, row_number() OVER (PARTITION BY tenant_id, b ORDER BY starts_at, id) AS n
    FROM base
  )
  UPDATE "events" e
  SET slug = CASE WHEN numbered.n = 1 THEN numbered.b
                  ELSE rtrim(left(numbered.b, 76), '-') || '-' || numbered.n END
  FROM numbered
  WHERE e.id = numbered.id;

  CREATE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE UNIQUE INDEX "tenant_slug_3_idx" ON "events" USING btree ("tenant_id","slug");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX "events_slug_idx";
  DROP INDEX "tenant_slug_3_idx";
  ALTER TABLE "events" DROP COLUMN "body";
  ALTER TABLE "events" DROP COLUMN "slug";`)
}
