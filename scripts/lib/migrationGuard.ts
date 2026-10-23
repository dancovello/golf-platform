/**
 * Spots database changes that delete or rewrite data, or weaken the database's own security
 * rules, so they can't reach production without Dan's explicit approval
 * (docs/plans/step-3-backups-migrations-production.md, 3.4; migrations audit, finding 3).
 * Pure functions: no database, no network.
 */

/** 'data': deletes or rewrites data. 'security': weakens a rule that keeps clubs apart or limits
 * what the website's database account can do. Both need the same label. */
export type Finding = {
  kind: 'data' | 'security'
  pattern: string
  explanation: string
  line: string
}

type Rule = { pattern: RegExp; name: string; explanation: string }

const DATA_RULES: Rule[] = [
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
    // The table may carry an alias: UPDATE "tenants" t SET … / UPDATE ONLY x AS t SET …
    pattern: /\bUPDATE\s+(?:ONLY\s+)?["\w.]+(?:\s+(?:AS\s+)?["\w]+)?\s+SET\b/i,
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

const SECURITY_RULES: Rule[] = [
  { name: 'GRANT', pattern: /\bGRANT\b/i, explanation: 'gives a database account more rights' },
  { name: 'REVOKE', pattern: /\bREVOKE\b/i, explanation: 'changes what a database account may do' },
  {
    name: 'role change',
    pattern: /\b(ALTER|CREATE|DROP)\s+ROLE\b|\bALTER\s+DEFAULT\s+PRIVILEGES\b/i,
    explanation: 'changes a database account or its default rights',
  },
  {
    // Only club columns: Payload often makes ordinary fields optional (drafts need it).
    name: 'club column may be empty',
    pattern: /\bALTER\s+COLUMN\s+"?(?:version_)?tenant_id"?\s+DROP\s+NOT\s+NULL\b/i,
    explanation: 'lets a record have no club',
  },
  {
    // A record's own club link (tenant_id). Child rows (_parent_id) and the search index are
    // meant to go with their club.
    name: 'club link that deletes or clears',
    pattern:
      /\bFOREIGN\s+KEY\s*\(\s*"?(?:version_)?tenant_id"?\s*\)\s*REFERENCES\s+(?:"?public"?\.)?"?tenants"?\s*\([^)]*\)\s*ON\s+DELETE\s+(?:CASCADE|SET\s+NULL)\b/i,
    explanation: 'deleting a club would delete or orphan its content instead of being refused',
  },
  {
    name: 'trigger removed or switched off',
    pattern: /\bDROP\s+TRIGGER\b|\bDISABLE\s+TRIGGER\b/i,
    explanation: 'removes or switches off a database rule, e.g. "an account never changes club"',
  },
  {
    name: 'DROP FUNCTION',
    pattern: /\bDROP\s+FUNCTION\b/i,
    explanation: 'removes code a database rule may depend on',
  },
  {
    name: 'SECURITY DEFINER',
    pattern: /\bSECURITY\s+DEFINER\b/i,
    explanation: 'code that runs with its owner’s rights, whoever calls it',
  },
  {
    name: 'row security change',
    pattern: /\b(DROP|ALTER)\s+POLICY\b|\b(DISABLE|NO\s+FORCE)\s+ROW\s+LEVEL\s+SECURITY\b/i,
    explanation: 'weakens row-level security rules',
  },
  {
    name: 'adds an account',
    pattern: /\bINSERT\s+INTO\s+(?:"?public"?\.)?"?users"?\b/i,
    explanation: 'creates an account from a database change; accounts come only from the scripts',
  },
]

const RULES: (Rule & { kind: Finding['kind'] })[] = [
  ...DATA_RULES.map((r) => ({ ...r, kind: 'data' as const })),
  ...SECURITY_RULES.map((r) => ({ ...r, kind: 'security' as const })),
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
        kind: rule.kind,
        pattern: rule.name,
        explanation: rule.explanation,
        line: text.slice(from, match.index + match[0].length + 40).trim(),
      })
    }
  }
  // A rule the database enforces, dropped and not added back under the same name.
  for (const match of text.matchAll(/\bDROP\s+CONSTRAINT\s+(?:IF\s+EXISTS\s+)?("?[\w]+"?)/gi)) {
    const name = match[1].replace(/"/g, '')
    if (new RegExp(`\\bADD\\s+CONSTRAINT\\s+"?${name}"?`, 'i').test(text)) continue
    findings.push({
      kind: 'security',
      pattern: 'DROP CONSTRAINT',
      explanation: `removes the rule "${name}" without adding it back`,
      line: match[0],
    })
  }
  // SQL pulled in from another file can't be checked here, so it always needs a human look.
  for (const match of source.matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)) {
    findings.push({
      kind: 'security',
      pattern: 'imports other code',
      explanation: `uses code from ${match[1]}, which this check can't read`,
      line: match[0],
    })
  }
  return findings
}

export type ChangedFile = { status: 'added' | 'modified' | 'deleted' | 'renamed'; path: string }

/** The naming rule for a migration file, directly in src/migrations. */
export const MIGRATION_NAME = /^\d{8}_\d{6}_[\w-]+$/

/**
 * Every file under src/migrations (any name, any folder) except the list of migrations
 * (index.ts) and the saved snapshots (.json): anything else there could be run, so it is
 * checked whatever it is called (migrations audit, finding 3).
 */
const isMigration = (path: string) =>
  path.startsWith('src/migrations/') &&
  path !== 'src/migrations/index.ts' &&
  !path.endsWith('.json')

/** Merged migrations may already have run on production, so they must never change. */
export const changedExistingMigrations = (files: ChangedFile[]) =>
  files.filter((f) => isMigration(f.path) && f.status !== 'added')

export const addedMigrations = (files: ChangedFile[]) =>
  files.filter((f) => isMigration(f.path) && f.status === 'added')

/**
 * The list of migrations (src/migrations/index.ts) decides what runs. It may only bring in
 * files that follow the naming rule, directly in src/migrations. Returns the imports that don't.
 */
export const badIndexImports = (source: string): string[] =>
  [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)]
    .map((m) => m[1])
    .filter((from) => !(from.startsWith('./') && MIGRATION_NAME.test(from.slice(2))))
