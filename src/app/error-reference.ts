/**
 * The short reference Next.js gives an error that happened on the server (`error.digest`). The
 * error pages show it so a visitor can quote it; the message itself is never shown. Nothing
 * else about the error is kept here: the server already reported it (src/instrumentation.ts).
 */
export const errorReference = (error: unknown): string | null => {
  const digest = (error as { digest?: unknown } | null)?.digest
  return typeof digest === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(digest) ? digest : null
}
