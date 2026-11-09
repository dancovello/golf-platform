import { describe, expect, it } from 'vitest'

import { demoPath } from '../../src/admin/demoPath'
import { Tenants } from '../../src/collections/Tenants'
import { demoBase } from '../../src/site/demo'

describe('demo link field', () => {
  it('builds the same path as the website uses', () => {
    expect(demoPath('cottrell-park', 'x7k2m9pqx7k2m9pq')).toBe(
      demoBase('cottrell-park', 'x7k2m9pqx7k2m9pq'),
    )
  })

  it('is a display-only field that shows only when the demo is on', () => {
    const field = (
      Tenants.fields as {
        name?: string
        type?: string
        admin?: { condition?: (d: object) => boolean }
      }[]
    ).find((f) => f.name === 'demoLink')
    expect(field?.type).toBe('ui')
    expect(field?.admin?.condition?.({ demoEnabled: true })).toBe(true)
    expect(field?.admin?.condition?.({ demoEnabled: false })).toBe(false)
  })
})
