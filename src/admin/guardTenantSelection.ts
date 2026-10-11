import type { Config, Plugin } from 'payload'

const ORIGINAL = '@payloadcms/plugin-multi-tenant/rsc#TenantSelectionProvider'
const REPLACEMENT = '/admin/TenantSelectionAfterTwoFactor#TenantSelectionAfterTwoFactor'

/** Swaps in TenantSelectionAfterTwoFactor. Must run after multiTenantPlugin. */
export const guardTenantSelection: Plugin = (config: Config): Config => {
  const providers = config.admin?.components?.providers ?? []
  let replaced = false
  const next = providers.map((provider) => {
    if (typeof provider === 'object' && provider?.path === ORIGINAL) {
      replaced = true
      return { ...provider, path: REPLACEMENT }
    }
    return provider
  })
  if (!replaced)
    throw new Error('guardTenantSelection: multi-tenant provider not found; check plugin order')
  return {
    ...config,
    admin: { ...config.admin, components: { ...config.admin?.components, providers: next } },
  }
}
