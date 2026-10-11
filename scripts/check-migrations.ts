/**
 * CI guard for database changes. Run by the `migration-guard` job on every pull request.
 *
 *   node scripts/check-migrations.ts <base-ref>
 *
 * Fails if the PR edits or deletes an existing migration, or adds one that deletes or
 * rewrites data, unless APPROVED_DESTRUCTIVE=true (set when Dan adds the
 * `approved-destructive-migration` label to the PR).
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

import {
  addedMigrations,
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

const approved = process.env.APPROVED_DESTRUCTIVE === 'true'
for (const file of addedMigrations(files)) {
  const findings = findDestructive(readFileSync(file.path, 'utf8'))
  if (findings.length === 0) {
    console.log(`OK: ${file.path} only adds things.`)
    continue
  }
  console.log(`${file.path} deletes or rewrites data:`)
  for (const f of findings) console.log(`  - ${f.pattern}: ${f.explanation}\n      ${f.line}`)
  if (approved) {
    console.log(
      '  Approved by Dan (approved-destructive-migration label). A backup point is taken before release.\n',
    )
  } else {
    failed = true
    console.log(
      '  Needs Dan’s approval: explain in the PR, in plain English, what data changes and why,\n' +
        '  then Dan adds the "approved-destructive-migration" label.\n',
    )
  }
}

if (addedMigrations(files).length === 0 && edited.length === 0) {
  console.log('No database changes in this pull request.')
}
process.exit(failed ? 1 : 0)
