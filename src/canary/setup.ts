import { randomBytes } from 'node:crypto'

import type { Payload } from 'payload'

import { allowAccountCreation } from '../access/accountCreation'
import { CANARY_A_SLUG, CANARY_B_SLUG, CANARY_MARKER } from './targets'

/**
 * Creates the two hidden canary clubs (docs/operations/canary.md): no web address (the clubs
 * collection refuses one for them), a password-only editor in canary A, and a few marked
 * records in canary B. Returns canary A's editor email and a new random password, shown once.
 * Run only through scripts/create-canary-clubs.ts; on production only with Dan's approval.
 */
export const createCanaryClubs = async (payload: Payload, editorEmail: string) => {
  const existing = await payload.count({
    collection: 'tenants',
    where: { slug: { in: [CANARY_A_SLUG, CANARY_B_SLUG] } },
    overrideAccess: true,
  })
  if (existing.totalDocs > 0) throw new Error('The canary clubs already exist.')
  const clubA = await payload.create({
    collection: 'tenants',
    data: { name: 'Canary A (hidden test club)', slug: CANARY_A_SLUG },
    overrideAccess: true,
  })
  const clubB = await payload.create({
    collection: 'tenants',
    data: { name: 'Canary B (hidden test club)', slug: CANARY_B_SLUG },
    overrideAccess: true,
  })
  const tenant = clubB.id
  await payload.create({
    collection: 'pages',
    data: { title: `${CANARY_MARKER} page`, slug: 'canary', tenant, _status: 'published' } as never,
    overrideAccess: true,
  })
  await payload.create({
    collection: 'news',
    data: {
      title: `${CANARY_MARKER} news`,
      category: 'club',
      status: 'published',
      publishedAt: new Date().toISOString(),
      tenant,
    } as never,
    overrideAccess: true,
  })
  await payload.create({
    collection: 'staff',
    data: { name: `${CANARY_MARKER} person`, role: 'Canary', department: 'golf', tenant } as never,
    overrideAccess: true,
  })
  // A marked account in club B, so the canary notices if club A can ever list it (CRON-3).
  // Nobody signs in as it: its password is thrown away.
  await payload.create({
    collection: 'users',
    data: {
      email: `canary-b-${randomBytes(6).toString('hex')}@canary.invalid`,
      password: randomBytes(24).toString('base64url'),
      role: 'editor',
      tenant,
    },
    context: allowAccountCreation,
    overrideAccess: true,
  })
  const password = randomBytes(24).toString('base64url')
  await payload.create({
    collection: 'users',
    data: { email: editorEmail, password, role: 'editor', tenant: clubA.id },
    context: allowAccountCreation,
    overrideAccess: true,
  })
  return { email: editorEmail, password }
}
