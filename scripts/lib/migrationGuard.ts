/**
 * Spots database changes that delete or rewrite data, so they can't reach production without
 * Dan's explicit approval (docs/plans/step-3-backups-migrations-production.md, 3.4).
 * Pure functions: no database, no network.
 */

export type Finding = { pattern: string; explanation: string; line: string }

const RULES: { pattern: RegExp; name: string; explanation: string }[] = [
  {
    name: 'DROP TABLE',
    pattern: /\bDROP\s+TABLE\b/i,
    explanation: 'deletes a whole table and everything in it',
  },
  {
    name: 'DROP COLUMN',
    pattern: /\bDROP\s+COLUMN\b/i,
    explanation: 'deletes a column and its data from every record',
  },
  { name: 'TRUNCATE', pattern: /\bTRUNCATE\b/i, explanation: 'empties a table' },
  { name: 'DELETE FROM', pattern: /\bDELETE\s+FROM\b/i, explanation: 'deletes records' },
  {
    name: 'UPDATE … SET',
    pattern: /\bUPDATE\s+["\w.]+\s+SET\b/i,
    explanation: 'rewrites existing records',
  },
  {
    name: 'change column type',
    pattern: /\bALTER\s+COLUMN\s+["\w]+\s+(SET\s+DATA\s+)?TYPE\b/i,
    explanation: 'changes the kind of data a column holds, which can lose or alter existing values',
  },
  {
    name: 'RENAME',
    pattern: /\bRENAME\s+(COLUMN|TO)\b/i,
    explanation: 'renames something the live app may still be using during a release',
  },
  {
    name: 'DROP SCHEMA',
    pattern: /\bDROP\s+SCHEMA\b/i,
    explanation: 'deletes a whole section of the database',
  },
  {
    name: 'DROP TYPE',
    pattern: /\bDROP\s+TYPE\b/i,
    explanation: 'deletes a list of allowed values that columns may depend on',
  },
]

/**
 * The part of a migration that runs when it's applied: its `up` function. Fails safe: if the
 * file isn't laid out as expected (no `up`, or `down` before `up`), the whole file is checked.
 */
export const upSection = (source: string): string => {
  const start = source.indexOf('export async function up')
  const end = source.indexOf('export async function down')
  if (start === -1 || end <= start) return source
  return source.slice(start, end)
}

/**
 * Destructive statements in a migration's `up` section, with plain-English explanations.
 * Fails safe: comments are not stripped (a destructive word in a comment is flagged too, which
 * just means Dan reads it), and line breaks are collapsed so a statement split across lines is
 * still caught.
 */
export const findDestructive = (source: string): Finding[] => {
  const text = upSection(source).replace(/\s+/g, ' ')
  const findings: Finding[] = []
  for (const rule of RULES) {
    const global = new RegExp(rule.pattern.source, 'gi')
    for (const match of text.matchAll(global)) {
      const from = Math.max(0, match.index - 40)
      findings.push({
        pattern: rule.name,
        explanation: rule.explanation,
        line: text.slice(from, match.index + match[0].length + 40).trim(),
      })
    }
  }
  // SQL pulled in from another file can't be checked here, so it always needs a human look.
  for (const match of source.matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)) {
    findings.push({
      pattern: 'imports other code',
      explanation: `uses code from ${match[1]}, which this check can't read`,
      line: match[0],
    })
  }
  return findings
}

export type ChangedFile = { status: 'added' | 'modified' | 'deleted' | 'renamed'; path: string }

const isMigration = (path: string) => /^src\/migrations\/\d{8}_\d{6}_[\w-]+\.ts$/.test(path)

/** Merged migrations may already have run on production, so they must never change. */
export const changedExistingMigrations = (files: ChangedFile[]) =>
  files.filter((f) => isMigration(f.path) && f.status !== 'added')

export const addedMigrations = (files: ChangedFile[]) =>
  files.filter((f) => isMigration(f.path) && f.status === 'added')
