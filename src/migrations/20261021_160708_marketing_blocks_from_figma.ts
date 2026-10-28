import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_mk_header_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum_mk_cards_cards_icon" AS ENUM('check', 'clock', 'calendar', 'players', 'flag', 'lock', 'mail', 'phone', 'pin', 'search', 'file', 'download', 'info', 'sun');
  CREATE TYPE "public"."enum_mk_cards_style" AS ENUM('rows', 'cards');
  CREATE TYPE "public"."enum__mk_header_v_align" AS ENUM('left', 'center');
  CREATE TYPE "public"."enum__mk_cards_v_cards_icon" AS ENUM('check', 'clock', 'calendar', 'players', 'flag', 'lock', 'mail', 'phone', 'pin', 'search', 'file', 'download', 'info', 'sun');
  CREATE TYPE "public"."enum__mk_cards_v_style" AS ENUM('rows', 'cards');
  ALTER TABLE "mk_header" ADD COLUMN "align" "enum_mk_header_align" DEFAULT 'left';
  ALTER TABLE "mk_media" ADD COLUMN "window_address" varchar;
  ALTER TABLE "mk_cards_cards" ADD COLUMN "icon" "enum_mk_cards_cards_icon" DEFAULT 'check';
  ALTER TABLE "mk_cards_cards" ADD COLUMN "link_label" varchar;
  ALTER TABLE "mk_cards_cards" ADD COLUMN "link_href" varchar;
  ALTER TABLE "mk_cards" ADD COLUMN "style" "enum_mk_cards_style" DEFAULT 'rows';
  ALTER TABLE "mk_cta" ADD COLUMN "primary_label" varchar DEFAULT 'Book a demo';
  ALTER TABLE "mk_cta" ADD COLUMN "primary_href" varchar DEFAULT '/book-a-demo';
  ALTER TABLE "mk_cta" ADD COLUMN "secondary_label" varchar DEFAULT 'Get your free homepage';
  ALTER TABLE "mk_cta" ADD COLUMN "secondary_href" varchar DEFAULT '/switching';
  ALTER TABLE "_mk_header_v" ADD COLUMN "align" "enum__mk_header_v_align" DEFAULT 'left';
  ALTER TABLE "_mk_media_v" ADD COLUMN "window_address" varchar;
  ALTER TABLE "_mk_cards_v_cards" ADD COLUMN "icon" "enum__mk_cards_v_cards_icon" DEFAULT 'check';
  ALTER TABLE "_mk_cards_v_cards" ADD COLUMN "link_label" varchar;
  ALTER TABLE "_mk_cards_v_cards" ADD COLUMN "link_href" varchar;
  ALTER TABLE "_mk_cards_v" ADD COLUMN "style" "enum__mk_cards_v_style" DEFAULT 'rows';
  ALTER TABLE "_mk_cta_v" ADD COLUMN "primary_label" varchar DEFAULT 'Book a demo';
  ALTER TABLE "_mk_cta_v" ADD COLUMN "primary_href" varchar DEFAULT '/book-a-demo';
  ALTER TABLE "_mk_cta_v" ADD COLUMN "secondary_label" varchar DEFAULT 'Get your free homepage';
  ALTER TABLE "_mk_cta_v" ADD COLUMN "secondary_href" varchar DEFAULT '/switching';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "mk_header" DROP COLUMN "align";
  ALTER TABLE "mk_media" DROP COLUMN "window_address";
  ALTER TABLE "mk_cards_cards" DROP COLUMN "icon";
  ALTER TABLE "mk_cards_cards" DROP COLUMN "link_label";
  ALTER TABLE "mk_cards_cards" DROP COLUMN "link_href";
  ALTER TABLE "mk_cards" DROP COLUMN "style";
  ALTER TABLE "mk_cta" DROP COLUMN "primary_label";
  ALTER TABLE "mk_cta" DROP COLUMN "primary_href";
  ALTER TABLE "mk_cta" DROP COLUMN "secondary_label";
  ALTER TABLE "mk_cta" DROP COLUMN "secondary_href";
  ALTER TABLE "_mk_header_v" DROP COLUMN "align";
  ALTER TABLE "_mk_media_v" DROP COLUMN "window_address";
  ALTER TABLE "_mk_cards_v_cards" DROP COLUMN "icon";
  ALTER TABLE "_mk_cards_v_cards" DROP COLUMN "link_label";
  ALTER TABLE "_mk_cards_v_cards" DROP COLUMN "link_href";
  ALTER TABLE "_mk_cards_v" DROP COLUMN "style";
  ALTER TABLE "_mk_cta_v" DROP COLUMN "primary_label";
  ALTER TABLE "_mk_cta_v" DROP COLUMN "primary_href";
  ALTER TABLE "_mk_cta_v" DROP COLUMN "secondary_label";
  ALTER TABLE "_mk_cta_v" DROP COLUMN "secondary_href";
  DROP TYPE "public"."enum_mk_header_align";
  DROP TYPE "public"."enum_mk_cards_cards_icon";
  DROP TYPE "public"."enum_mk_cards_style";
  DROP TYPE "public"."enum__mk_header_v_align";
  DROP TYPE "public"."enum__mk_cards_v_cards_icon";
  DROP TYPE "public"."enum__mk_cards_v_style";`)
}
