import { readdirSync, readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  addedMigrations,
  changedExistingMigrations,
  findDestructive,
} from '../../scripts/lib/migrationGuard'

const migration = (up: string, down = 'DROP TABLE "x";') => `
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql\`${up}\`)
}
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql\`${down}\`)
}
`

describe('destructive database changes are spotted', () => {
  it.each([
    ['DROP TABLE "pages" CASCADE;', 'DROP TABLE'],
    ['ALTER TABLE "users" DROP COLUMN "phone";', 'DROP COLUMN'],
    ['TRUNCATE "pages";', 'TRUNCATE'],
    ["DELETE FROM pages WHERE slug = 'x';", 'DELETE FROM'],
    ['UPDATE "pages" SET "title" = upper("title");', 'UPDATE … SET'],
    ['UPDATE "tenants" t SET "slug" = s.slug FROM s;', 'UPDATE … SET'],
    ['UPDATE ONLY "public"."tenants" AS t SET "slug" = 1;', 'UPDATE … SET'],
    ['ALTER TABLE "pages" ALTER COLUMN "slug" SET DATA TYPE integer;', 'change column type'],
    ['ALTER TABLE "pages" RENAME COLUMN "slug" TO "path";', 'RENAME'],
  ])('%s', (sql, rule) => {
    expect(findDestructive(migration(sql)).map((f) => f.pattern)).toContain(rule)
  })

  it('does not mistake a foreign key rule for an update', () => {
    const fk =
      'ALTER TABLE "a" ADD CONSTRAINT "f" FOREIGN KEY ("b") REFERENCES "b"("id") ON DELETE set null ON UPDATE SET NULL;'
    expect(findDestructive(migration(fk))).toEqual([])
  })

  it('only looks at the "apply" half, not the "undo" half', () => {
    expect(findDestructive(migration('CREATE TABLE "x" ("id" uuid);', 'DROP TABLE "x";'))).toEqual(
      [],
    )
  })

  it('fails safe: flags destructive words even in comments', () => {
    expect(
      findDestructive(migration('-- DROP TABLE mentioned here\nCREATE TABLE "x" ("id" uuid);')),
    ).not.toEqual([])
  })

  it("can't be hidden behind a -- inside quoted text", () => {
    const sql = `INSERT INTO notes (t) VALUES ('--'); DROP TABLE "pages";`
    expect(findDestructive(migration(sql)).map((f) => f.pattern)).toContain('DROP TABLE')
  })

  it('catches a statement split across lines', () => {
    expect(findDestructive(migration('DROP\n   TABLE "pages";')).map((f) => f.pattern)).toContain(
      'DROP TABLE',
    )
  })

  it('checks the whole file if the undo half comes first', () => {
    const odd = `
export async function down() { await db.execute(sql\`CREATE TABLE "x" ("id" uuid);\`) }
export async function up() { await db.execute(sql\`DROP TABLE "pages";\`) }`
    expect(findDestructive(odd).map((f) => f.pattern)).toContain('DROP TABLE')
  })

  it('flags SQL pulled in from another file', () => {
    const src = `import { dropAll } from './helpers/dangerous'\n${migration('CREATE TABLE "x" ("id" uuid);')}`
    expect(findDestructive(src).map((f) => f.pattern)).toContain('imports other code')
  })

  it('allows replacing a constraint (no data is lost)', () => {
    const sql =
      'ALTER TABLE "users" DROP CONSTRAINT "fk";\nALTER TABLE "users" ADD CONSTRAINT "fk" FOREIGN KEY ("t") REFERENCES "tenants"("id");'
    expect(findDestructive(migration(sql))).toEqual([])
  })

  // Migrations Dan approved with the approved-destructive-migration label, and what they do.
  const APPROVED: Record<string, string[]> = {
    // PR #38: fills in each existing club's new short name from its name.
    '20261011_201540_branding_and_club_short_name.ts': ['UPDATE … SET'],
  }

  it('every merged migration only adds things, apart from the ones Dan approved', () => {
    for (const file of readdirSync('src/migrations').filter((f) => /^\d{8}_.*\.ts$/.test(f))) {
      expect({
        file,
        findings: findDestructive(readFileSync(`src/migrations/${file}`, 'utf8')).map(
          (f) => f.pattern,
        ),
      }).toEqual({
        file,
        findings: APPROVED[file] ?? [],
      })
    }
  })
})

describe('merged migrations never change', () => {
  const files = [
    { status: 'added' as const, path: 'src/migrations/20261101_120000_new_thing.ts' },
    { status: 'modified' as const, path: 'src/migrations/20261011_072736_initial.ts' },
    { status: 'deleted' as const, path: 'src/migrations/20261011_082024_club_content.ts' },
    { status: 'modified' as const, path: 'src/migrations/index.ts' },
    { status: 'added' as const, path: 'src/migrations/oddly-named.ts' },
    { status: 'modified' as const, path: 'src/collections/Pages.ts' },
  ]

  it('flags edited or deleted migrations', () => {
    expect(changedExistingMigrations(files).map((f) => f.path)).toEqual([
      'src/migrations/20261011_072736_initial.ts',
      'src/migrations/20261011_082024_club_content.ts',
    ])
  })

  it('checks every file in src/migrations except the index, whatever it is called', () => {
    expect(addedMigrations(files).map((f) => f.path)).toEqual([
      'src/migrations/20261101_120000_new_thing.ts',
    ])
  })
})
