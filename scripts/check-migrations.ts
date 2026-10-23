/**
 * CI guard for database changes. Run by the `migration-guard` job on every pull request.
 *
 *   node scripts/check-migrations.ts <base-ref>
 *
 * Fails if the PR edits or deletes an existing migration, changes the list of migrations to
 * run anything that isn't a properly named migration, or adds one that deletes or rewrites data
 * or weakens a database security rule, unless APPROVED_DESTRUCTIVE=true (set when Dan has added
 * the `approved-destructive-migration` label since the latest push, scripts/check-approval.ts).
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

import {
  addedMigrations,
  badIndexImports,
  type ChangedFile,
  changedExistingMigrations,
  findDestructive,
} from './lib/migrationGuard.ts'

const base = process.argv[2] ?? 'origin/main'
const statusWord: Record<string, ChangedFile['status']> = {
  A: 'added',
  M: 'modified',
  D: 'deleted',
  R: 'renamed',
}
const files: ChangedFile[] = execFileSync('git', ['diff', '--name-status', `${base}...HEAD`], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean)
  .map((row) => {
    const [code, ...paths] = row.split('\t')
    return { status: statusWord[code[0]] ?? 'modified', path: paths[paths.length - 1] }
  })

let failed = false

const edited = changedExistingMigrations(files)
if (edited.length > 0) {
  failed = true
  console.log('These migrations already exist on main and may have run on production:')
  for (const f of edited) console.log(`  - ${f.path} (${f.status})`)
  console.log(
    'Never change a merged migration. Make a new one instead: pnpm migrate:create <name>\n',
  )
}

if (files.some((f) => f.path === 'src/migrations/index.ts' && f.status !== 'deleted')) {
  const bad = badIndexImports(readFileSync('src/migrations/index.ts', 'utf8'))
  if (bad.length > 0) {
    failed = true
    console.log('src/migrations/index.ts brings in files that aren’t properly named migrations:')
    for (const from of bad) console.log(`  - ${from}`)
    console.log('Only files named like 20261101_120000_name, directly in src/migrations.\n')
  }
}

const approved = process.env.APPROVED_DESTRUCTIVE === 'true'
for (const file of addedMigrations(files)) {
  const findings = findDestructive(readFileSync(file.path, 'utf8'))
  if (findings.length === 0) {
    console.log(`OK: ${file.path} only adds things.`)
    continue
  }
  const data = findings.filter((f) => f.kind === 'data')
  const security = findings.filter((f) => f.kind === 'security')
  if (data.length > 0) {
    console.log(`${file.path} deletes or rewrites data:`)
    for (const f of data) console.log(`  - ${f.pattern}: ${f.explanation}\n      ${f.line}`)
  }
  if (security.length > 0) {
    console.log(`${file.path} changes database security rules:`)
    for (const f of security) console.log(`  - ${f.pattern}: ${f.explanation}\n      ${f.line}`)
  }
  if (approved) {
    console.log(
      '  Approved by Dan (approved-destructive-migration label). A backup point is taken before release.\n',
    )
  } else {
    failed = true
    console.log(
      '  Needs Dan’s approval: explain in the PR, in plain English, what changes and why,\n' +
        '  then Dan adds the "approved-destructive-migration" label (after the last push).\n',
    )
  }
}

if (addedMigrations(files).length === 0 && edited.length === 0) {
  console.log('No database changes in this pull request.')
}
process.exit(failed ? 1 : 0)
