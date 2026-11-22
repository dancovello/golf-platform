import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Only changes the default wording of the "Your content comes with you" label for new blocks.
// (The generator also proposed dropping the old photo-size columns; that is unrelated and
// destructive, so it is deliberately left out.)
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "mk_moves" ALTER COLUMN "chip" SET DEFAULT 'Copied across for you';
  ALTER TABLE "_mk_moves_v" ALTER COLUMN "chip" SET DEFAULT 'Copied across for you';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "mk_moves" ALTER COLUMN "chip" SET DEFAULT 'Copied across with AI';
  ALTER TABLE "_mk_moves_v" ALTER COLUMN "chip" SET DEFAULT 'Copied across with AI';`)
}
