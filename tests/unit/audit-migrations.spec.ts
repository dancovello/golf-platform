/**
 * Security audit of migrations and the release pipeline, 22 Oct 2026
 * (docs/security/audit-migrations.md).
 *
 * Every test here proves a finding and is marked `it.fails`: it passes CI while the problem
 * exists, and starts failing once the fix lands. When that happens, the fix's PR turns
 * `it.fails` into `it`, so the test then guards against the problem coming back.
 */
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { addedMigrations, findDestructive } from '../../scripts/lib/migrationGuard'

const workflow = (name: string) => readFileSync(`.github/workflows/${name}`, 'utf8')

/** Each job's own text, keyed by job name (two-space indent under `jobs:`). */
const jobsOf = (source: string): Record<string, string> => {
  const body = source.slice(source.indexOf('\njobs:\n') + 7)
  const jobs: Record<string, string> = {}
  let current = ''
  for (const line of body.split('\n')) {
    const name = /^ {2}([\w-]+):\s*$/.exec(line)
    if (name) current = name[1]
    else if (current) jobs[current] = `${jobs[current] ?? ''}${line}\n`
  }
  return jobs
}

const PRODUCTION_SECRETS =
  /secrets\.(PRODUCTION_DATABASE_URL_DIRECT|VERCEL_TOKEN|R2_SECRET_ACCESS_KEY)/

describe('Finding 1 (high): production secrets are open to every branch', () => {
  // A GitHub environment with a branch rule is what stops a workflow on any other branch from
  // reading these. Without one, any pushed branch can add a workflow that reads them.
  it('every job that reads a production secret is locked to a GitHub environment', () => {
    const unlocked: string[] = []
    for (const file of ['release.yml', 'backup.yml']) {
      for (const [job, text] of Object.entries(jobsOf(workflow(file)))) {
        if (PRODUCTION_SECRETS.test(text) && !/^ {4}environment:/m.test(text)) {
          unlocked.push(`${file} → ${job}`)
        }
      }
    }
    expect(unlocked).toEqual([])
  })
})

describe('Finding 2 (medium): a release pull request can come from any branch', () => {
  // The security scan only runs on pull requests into main. A pull request straight into
  // production from another branch skips it, and nothing checks where the release came from.
  it('pull requests into production must come from main, or be security-reviewed', () => {
    const reviewCoversProduction = /branches:\s*\[[^\]]*production/.test(
      workflow('security-review.yml'),
    )
    const sourceChecked = /pull_request\.head\.ref/.test(workflow('ci.yml'))
    expect(reviewCoversProduction || sourceChecked).toBe(true)
  })
})

describe('Finding 3 (medium): migrations that weaken security pass every automatic check', () => {
  const migration = (up: string) => `
export async function up({ db }) {
  await db.execute(sql\`${up}\`)
}
export async function down({ db }) {}
`
  it('the security scan reads migrations', () => {
    expect(workflow('security-review.yml')).not.toMatch(/--exclude[ =]\S*src\/migrations/)
  })

  it.each([
    [
      'gives the website account more rights',
      'GRANT ALL ON ALL TABLES IN SCHEMA public TO golf_app;',
    ],
    ['lets a record have no club', 'ALTER TABLE "pages" ALTER COLUMN "tenant_id" DROP NOT NULL;'],
    [
      'makes deleting a club delete its content',
      'ALTER TABLE "pages" DROP CONSTRAINT "pages_tenant_id_tenants_id_fk"; ALTER TABLE "pages" ADD CONSTRAINT "pages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade;',
    ],
    [
      'removes the rule that an account never changes club',
      'DROP TRIGGER "users_role_tenant_immutable" ON "users";',
    ],
    ['switches that rule off', 'ALTER TABLE "users" DISABLE TRIGGER ALL;'],
    [
      'adds an account from a migration',
      `INSERT INTO "users" ("email", "role") VALUES ('x@example.com', 'super-admin');`,
    ],
  ])('migration-guard flags a migration that %s', (_label, sql) => {
    expect(findDestructive(migration(sql))).not.toEqual([])
  })

  it('migration-guard checks a migration whatever its file is called', () => {
    // Registered in src/migrations/index.ts, this runs on production like any other migration,
    // but the guard never reads it.
    expect(
      addedMigrations([
        { status: 'added', path: 'src/migrations/oddly-named.ts' },
        { status: 'added', path: 'src/migrations/later/20261101_120000_x.ts' },
      ]),
    ).toHaveLength(2)
  })
})
