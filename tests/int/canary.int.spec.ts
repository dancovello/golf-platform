/** The hidden canary clubs (docs/operations/canary.md). */
import { describe, expect, it } from 'vitest'

import { createCanaryClubs } from '@/canary/setup'
import { CANARY_B_SLUG, CANARY_MARKER, canaryTargets } from '@/canary/targets'

import { getTestPayload, resetDatabase } from './helpers/seed'

describe('the hidden canary clubs', () => {
  it('are created with marked records and a password-only editor, and found by the canary', async () => {
    const payload = await getTestPayload()
    await resetDatabase(payload)
    const { password } = await createCanaryClubs(payload, 'canary-a@example.com')
    expect(password.length).toBeGreaterThanOrEqual(24)
    await expect(
      payload.login({ collection: 'users', data: { email: 'canary-a@example.com', password } }),
    ).resolves.toHaveProperty('token')
    const targets = await canaryTargets(payload)
    expect(targets?.clubB.slug).toBe(CANARY_B_SLUG)
    expect(targets?.marker).toBe(CANARY_MARKER)
    expect(targets?.records.map((r) => r.collection)).toEqual(
      expect.arrayContaining(['pages', 'news', 'staff', 'club-settings']),
    )
    await expect(createCanaryClubs(payload, 'again@example.com')).rejects.toThrow(/already exist/)
  })

  it('can never be given a web address', async () => {
    const payload = await getTestPayload()
    const { docs } = await payload.find({
      collection: 'tenants',
      where: { slug: { equals: CANARY_B_SLUG } },
      overrideAccess: true,
    })
    await expect(
      payload.update({
        collection: 'tenants',
        id: docs[0]!.id,
        data: { domains: [{ hostname: 'canary.example.com' }] },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'tenants',
        data: { name: 'Canary C', slug: 'canary-c', domains: [{ hostname: 'c.example.com' }] },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })
})
