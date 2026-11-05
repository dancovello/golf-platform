/**
 * Safety check for the club import (docs/operations/club-import.md): the staging and production
 * settings files must point at different databases and different photo storage. On 5 Nov 2026 the
 * production file held staging's database address by mistake, so a "production" import landed in
 * staging's database. This catches that before anything connects.
 */

/** NAME=value lines, as in ~/.golf-platform/<target>-import.env. Quotes around values are removed. */
export const parseEnvText = (text: string): Record<string, string> => {
  const values: Record<string, string> = {}
  for (const line of text.split(/\r?\n/)) {
    const at = line.indexOf('=')
    if (at < 1 || line.trimStart().startsWith('#')) continue
    values[line.slice(0, at).trim()] = line
      .slice(at + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2')
  }
  return values
}

/**
 * Which database server a connection string points at. Neon's pooled address (`ep-x-pooler…`)
 * and direct address (`ep-x…`) are the same server, so the "-pooler" part is ignored. Null if
 * it isn't a connection string.
 */
export const databaseServer = (connection: string | undefined): string | null => {
  if (!connection) return null
  try {
    return new URL(connection).hostname.toLowerCase().replace(/-pooler(?=\.)/, '')
  } catch {
    return null
  }
}

/**
 * What is wrong with two settings files, in plain words (empty when they are properly apart).
 * Only database server names and bucket names are mentioned; no secrets.
 */
export const sharedSettings = (
  staging: Record<string, string>,
  production: Record<string, string>,
): string[] => {
  const problems: string[] = []
  const a = databaseServer(staging.DATABASE_URL)
  const b = databaseServer(production.DATABASE_URL)
  if (a && b && a === b) {
    problems.push(
      `Both files use the same database server (${a}). Staging and production must be different Neon projects.`,
    )
  }
  const bucket = (production.MEDIA_S3_BUCKET ?? '').trim()
  if (bucket && bucket === (staging.MEDIA_S3_BUCKET ?? '').trim()) {
    problems.push(`Both files use the same photo bucket (${bucket}).`)
  }
  const pub = (production.MEDIA_PUBLIC_URL ?? '').trim().replace(/\/+$/, '')
  if (pub && pub === (staging.MEDIA_PUBLIC_URL ?? '').trim().replace(/\/+$/, '')) {
    problems.push('Both files use the same public photo address.')
  }
  return problems
}
