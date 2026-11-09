import type { Config } from 'payload'
import { describe, expect, it } from 'vitest'

import { fixGlobalViewRedirect } from '../../src/admin/fixGlobalViewRedirect'

const PATH = '@payloadcms/plugin-multi-tenant/rsc#GlobalViewRedirect'

const configWith = (actions: unknown[]) =>
  ({ admin: { components: { actions } } }) as unknown as Config

describe('fixGlobalViewRedirect', () => {
  it('adds the field names the redirect component reads, keeping the ones already there', () => {
    const out = fixGlobalViewRedirect(
      configWith([
        { path: 'other#Thing' },
        {
          path: PATH,
          serverProps: {
            globalSlugs: ['club-settings'],
            tenantsArrayFieldName: 'tenants',
            tenantsArrayTenantFieldName: 'tenant',
          },
        },
      ]),
    ) as Config
    const actions = out.admin?.components?.actions as { path: string; serverProps?: unknown }[]
    expect(actions[0]).toEqual({ path: 'other#Thing' })
    expect(actions[1]?.serverProps).toEqual({
      globalSlugs: ['club-settings'],
      tenantsArrayFieldName: 'tenants',
      tenantsArrayTenantFieldName: 'tenant',
      tenantArrayFieldName: 'tenants',
      tenantArrayTenantFieldName: 'tenant',
    })
  })

  it('fails loudly when the redirect is not there (wrong plugin order)', () => {
    expect(() => fixGlobalViewRedirect(configWith([{ path: 'other#Thing' }]))).toThrow(
      /plugin order/,
    )
  })
})
