import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "mk_cta" ALTER COLUMN "secondary_label" SET DEFAULT 'See how switching works';
  ALTER TABLE "mk_home_hero" ALTER COLUMN "secondary_label" SET DEFAULT 'See how switching works';
  ALTER TABLE "mk_pricing" ALTER COLUMN "footnote" SET DEFAULT 'Prices exclude VAT. Plus a one-off setup fee. {notice} days’ notice after the first {term} months.';
  ALTER TABLE "mk_request" ALTER COLUMN "form_button" SET DEFAULT 'Book my demo';
  ALTER TABLE "mk_request" ALTER COLUMN "form_sent_title" SET DEFAULT 'Thanks.';
  ALTER TABLE "mk_builder_hero" ALTER COLUMN "secondary_label" SET DEFAULT 'See how switching works';
  ALTER TABLE "_mk_cta_v" ALTER COLUMN "secondary_label" SET DEFAULT 'See how switching works';
  ALTER TABLE "_mk_home_hero_v" ALTER COLUMN "secondary_label" SET DEFAULT 'See how switching works';
  ALTER TABLE "_mk_pricing_v" ALTER COLUMN "footnote" SET DEFAULT 'Prices exclude VAT. Plus a one-off setup fee. {notice} days’ notice after the first {term} months.';
  ALTER TABLE "_mk_request_v" ALTER COLUMN "form_button" SET DEFAULT 'Book my demo';
  ALTER TABLE "_mk_request_v" ALTER COLUMN "form_sent_title" SET DEFAULT 'Thanks.';
  ALTER TABLE "_mk_builder_hero_v" ALTER COLUMN "secondary_label" SET DEFAULT 'See how switching works';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "mk_cta" ALTER COLUMN "secondary_label" SET DEFAULT 'Get your free homepage';
  ALTER TABLE "mk_home_hero" ALTER COLUMN "secondary_label" SET DEFAULT 'Get your free homepage';
  ALTER TABLE "mk_pricing" ALTER COLUMN "footnote" SET DEFAULT 'Prices exclude VAT. No setup fee. {notice} days’ notice after the first {term} months.';
  ALTER TABLE "mk_request" ALTER COLUMN "form_button" SET DEFAULT 'Rebuild my homepage';
  ALTER TABLE "mk_request" ALTER COLUMN "form_sent_title" SET DEFAULT 'On its way.';
  ALTER TABLE "mk_builder_hero" ALTER COLUMN "secondary_label" SET DEFAULT 'Get your free homepage';
  ALTER TABLE "_mk_cta_v" ALTER COLUMN "secondary_label" SET DEFAULT 'Get your free homepage';
  ALTER TABLE "_mk_home_hero_v" ALTER COLUMN "secondary_label" SET DEFAULT 'Get your free homepage';
  ALTER TABLE "_mk_pricing_v" ALTER COLUMN "footnote" SET DEFAULT 'Prices exclude VAT. No setup fee. {notice} days’ notice after the first {term} months.';
  ALTER TABLE "_mk_request_v" ALTER COLUMN "form_button" SET DEFAULT 'Rebuild my homepage';
  ALTER TABLE "_mk_request_v" ALTER COLUMN "form_sent_title" SET DEFAULT 'On its way.';
  ALTER TABLE "_mk_builder_hero_v" ALTER COLUMN "secondary_label" SET DEFAULT 'Get your free homepage';`)
}
