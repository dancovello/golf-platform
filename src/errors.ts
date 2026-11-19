import { APIError, type AfterErrorHook } from 'payload'

/**
 * Payload's APIError, with a name that survives the production build. Payload only shows an
 * error's message to the person when the error has a name, and takes the name from the class
 * name, which the build can shorten to nothing. When it did (2026-10-21, after unrelated
 * changes moved code around), messages like "Passwords must be at least 12 characters." became
 * "An unknown error occurred." Use this instead of `new APIError(...)`.
 */
export const publicError = (
  message: string,
  status?: number,
  data: Record<string, unknown> | null = null,
  isPublic?: boolean,
) => {
  const error = new APIError(message, status, data, isPublic)
  error.name = 'APIError'
  return error
}

type FieldProblem = { path?: string; message?: string; label?: unknown }

/**
 * Keeps the "which field and why" part of a failed save (QA-08, QA-28, QA-38, 17 Nov 2026).
 * In the production build Payload's own check for a validation error fails (two copies of its
 * error class are loaded), so the reply carried only "The following field is invalid: Slug":
 * no field turned red and the reason was lost. This puts the details back, so the admin screen
 * marks each field and says why.
 *
 * Also rewrites the database's own "already used in this club" error, which names the stored
 * columns ("tenant_id, slug"), into a plain sentence on the field.
 */
/** Payload's stock wording for a list that is too long or too short, in plain English. */
const plainer = (message = '') =>
  message
    .replace(
      /^This field requires no more than (\d+) rows?\.?$/i,
      'You can add at most $1 of these.',
    )
    .replace(/^This field requires at least (\d+) rows?\.?$/i, 'Add at least $1 of these.')

const titleCase = (path: string) => {
  const last = path.split('.').pop() ?? path
  const words = last
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export const keepFieldMessages: AfterErrorHook = ({ error, result }) => {
  const e = error as { name?: string; message?: string; data?: { errors?: FieldProblem[] } }
  const problems = e?.name === 'ValidationError' ? e.data?.errors : undefined
  if (!Array.isArray(problems) || problems.length === 0) return
  const errors = problems.map((p) => {
    const columns = String(p.path ?? '').split(/,\s*/)
    if (columns.length > 1 && columns[0] === 'tenant_id') {
      const path = columns[columns.length - 1]!
      return {
        ...p,
        path,
        label: titleCase(path),
        message: 'Your club already has one with this. Choose a different one.',
      }
    }
    return { ...p, message: plainer(p.message) }
  })
  // One problem: the pop-up says what it is, not only which field ("Slug: …").
  const only = errors.length === 1 ? errors[0]! : undefined
  const headline =
    only?.message && typeof only.label === 'string'
      ? `${only.label}: ${only.message}`
      : (only?.message ?? e.message)
  return {
    response: {
      ...result,
      errors: [{ name: 'ValidationError', message: headline, data: { ...e.data, errors } }],
    },
    status: 400,
  }
}
