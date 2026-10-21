import { APIError } from 'payload'

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
