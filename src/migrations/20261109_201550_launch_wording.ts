import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "mk_pricing" ALTER COLUMN "footnote" SET DEFAULT 'Plus a one-off setup fee, which depends on the size and needs of your club. {notice} days’ notice after the first {term} months.';
  ALTER TABLE "_mk_pricing_v" ALTER COLUMN "footnote" SET DEFAULT 'Plus a one-off setup fee, which depends on the size and needs of your club. {notice} days’ notice after the first {term} months.';
  ALTER TABLE "marketing_settings" ALTER COLUMN "pricing_vat_label" DROP DEFAULT;
  ALTER TABLE "marketing_settings" ALTER COLUMN "pricing_vat_label" DROP NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "mk_pricing" ALTER COLUMN "footnote" SET DEFAULT 'Prices exclude VAT. Plus a one-off setup fee. {notice} days’ notice after the first {term} months.';
  ALTER TABLE "_mk_pricing_v" ALTER COLUMN "footnote" SET DEFAULT 'Prices exclude VAT. Plus a one-off setup fee. {notice} days’ notice after the first {term} months.';
  ALTER TABLE "marketing_settings" ALTER COLUMN "pricing_vat_label" SET DEFAULT '+ VAT';
  ALTER TABLE "marketing_settings" ALTER COLUMN "pricing_vat_label" SET NOT NULL;`)
}
