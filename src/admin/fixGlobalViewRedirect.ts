import type { Config, Plugin } from 'payload'

const PATH = '@payloadcms/plugin-multi-tenant/rsc#GlobalViewRedirect'

/**
 * Works around a bug in @payloadcms/plugin-multi-tenant 3.93.0. Its "GlobalViewRedirect" (what
 * sends a club editor from Club Settings to their own settings record) reads the names of the
 * accounts' club list as `tenantArrayFieldName` and `tenantArrayTenantFieldName`, but the plugin
 * hands them over as `tenantsArrayFieldName` and `tenantsArrayTenantFieldName`. The names arrive
 * empty, so every editor appears to have no clubs and is sent back to the admin home page.
 * Super-admins are not affected (they have access to every club).
 *
 * This adds the two names the component actually reads. It is harmless once the plugin is fixed,
 * and can be deleted then. Must run after multiTenantPlugin. Tested by
 * tests/unit/fix-global-view-redirect.spec.ts and, in the browser, by "Club Settings opens club
 * A's own settings" (tests/e2e/admin-isolation.spec.ts).
 */
export const fixGlobalViewRedirect: Plugin = (config: Config): Config => {
  const actions = config.admin?.components?.actions ?? []
  let fixed = false
  const next = actions.map((action) => {
    if (typeof action === 'object' && action?.path === PATH) {
      fixed = true
      const props = (action.serverProps ?? {}) as Record<string, unknown>
      return {
        ...action,
        serverProps: {
          ...props,
          tenantArrayFieldName: props.tenantsArrayFieldName,
          tenantArrayTenantFieldName: props.tenantsArrayTenantFieldName,
        },
      }
    }
    return action
  })
  if (!fixed)
    throw new Error(
      'fixGlobalViewRedirect: the multi-tenant redirect was not found; check plugin order',
    )
  return {
    ...config,
    admin: { ...config.admin, components: { ...config.admin?.components, actions: next } },
  }
}
