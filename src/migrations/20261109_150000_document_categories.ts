import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Documents take their category from the club's own list (Categories), shared with news,
 * instead of a fixed list of six. Every club gets the six document categories added to its
 * list, then each document is pointed at the one it had.
 *
 * The old "category" column is deliberately left in place: nothing reads it, it has a default
 * so new documents don't need it, and it lets this change be undone without losing anything.
 * Drop it in a later, separately approved migration.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "documents" ADD COLUMN "category_id" uuid;

  INSERT INTO "categories" ("tenant_id", "name", "slug", "created_at")
  SELECT t."id", c."name", c."slug", now() + (100 + c."position") * interval '1 millisecond'
  FROM "tenants" t
  CROSS JOIN (VALUES
    (1, 'Course & scorecards', 'course-scorecards'),
    (2, 'Policies', 'policies'),
    (3, 'Forms', 'forms'),
    (4, 'Minutes', 'minutes'),
    (5, 'Visitors', 'visitors'),
    (6, 'Other', 'other')
  ) AS c("position", "name", "slug")
  ON CONFLICT ("tenant_id", "slug") DO NOTHING;

  UPDATE "documents" d SET "category_id" = c."id"
  FROM "categories" c
  WHERE c."tenant_id" = d."tenant_id"
    AND c."slug" = (CASE d."category"::text WHEN 'course' THEN 'course-scorecards' ELSE d."category"::text END);

  UPDATE "documents" d SET "category_id" = c."id"
  FROM "categories" c
  WHERE d."category_id" IS NULL AND c."tenant_id" = d."tenant_id" AND c."slug" = 'other';

  ALTER TABLE "documents" ALTER COLUMN "category_id" SET NOT NULL;
  ALTER TABLE "documents" ADD CONSTRAINT "documents_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "documents_category_idx" ON "documents" USING btree ("category_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // The old column was never removed, so put it back in step with the new one: a document
  // whose category isn't one of the original six becomes "other".
  await db.execute(sql`
   UPDATE "documents" d SET "category" = (CASE
      WHEN c."slug" = 'course-scorecards' THEN 'course'
      WHEN c."slug" IN ('policies', 'forms', 'minutes', 'visitors') THEN c."slug"
      ELSE 'other' END)::"enum_documents_category"
  FROM "categories" c WHERE c."id" = d."category_id";

  ALTER TABLE "documents" DROP CONSTRAINT "documents_category_id_categories_id_fk";
  DROP INDEX "documents_category_idx";
  ALTER TABLE "documents" DROP COLUMN "category_id";`)
}
