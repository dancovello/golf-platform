/**
 * Read-only check of a restored copy of the database (docs/operations/restore-runbook.md,
 * section 4). Run with:  pnpm check-restored-copy
 *
 * It asks for the copy's connection string (hidden), then only reads. It runs inside a
 * read-only transaction, so it cannot change anything, even if pointed at production by
 * mistake. It connects straight to the database and never starts the website, so it needs
 * no secrets or encryption keys. Never run the test suites against a copy: they wipe the
 * database they run on.
 */
import { drizzle } from '@payloadcms/db-postgres/drizzle/node-postgres'

import { chooseDatabase, fail } from './lib/prompts'
import { formatReport, runChecks, runReadOnly } from './lib/restoredCopyCheck'

const main = async () => {
  console.log('Check a restored copy (read-only: nothing is changed)\n')
  await chooseDatabase('check (read only)')
  const db = drizzle(process.env.DATABASE_URL as string)
  try {
    const report = await runReadOnly(db as unknown as Parameters<typeof runReadOnly>[0], runChecks)
    console.log(`\n${formatReport(report)}\n`)
    await db.$client.end()
    process.exit(report.ok ? 0 : 1)
  } catch (error) {
    fail(`Could not run the check: ${(error as Error).message}`)
  }
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await main()
