import type { Access } from 'payload'

/** Nobody, including logged-in users. Use for operations only scripts may perform. */
export const denyAll: Access = () => false

/** Only the logged-in user's own record. */
export const selfOnly: Access = ({ req: { user } }) => {
  if (!user) return false
  return { id: { equals: user.id } }
}
