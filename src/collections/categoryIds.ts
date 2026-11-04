import type { Payload } from 'payload'

/**
 * A club's categories by web address, for the scripts that fill a club (the demo club, club
 * import, the canary clubs). Every new club starts with the starter categories
 * (src/collections/defaultCategories.ts), so a script can point news at them by name.
 */
export const categoryIds = async (payload: Payload, tenant: string) => {
  const { docs } = await payload.find({
    collection: 'categories',
    where: { tenant: { equals: tenant } },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  return new Map(docs.map((c) => [c.slug, String(c.id)]))
}
