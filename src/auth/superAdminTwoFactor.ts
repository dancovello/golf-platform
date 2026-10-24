import type { Access, Config, Endpoint, Plugin } from 'payload'

import { isSuperAdmin } from '../access/roles'
import { publicError } from '../errors'
import { isFullyAuthenticated } from './fullyAuthenticated'

/**
 * Two-factor for super-admins only (decisions.md, 22 Oct). payload-totp can only force set-up
 * for everyone or no one, so it runs with `forceSetup: false` and this plugin, which must run
 * after it, adds the super-admin rule back:
 *
 * 1. **Access:** every collection and settings rule refuses a super-admin who hasn't entered
 *    their code, apart from reading their own account (the code screens need it).
 * 2. **Admin screens:** a super-admin who hasn't set two-factor up is sent to the set-up screen
 *    (src/admin/SuperAdminTwoFactorProvider.tsx), as payload-totp did for everyone before.
 * 3. **Switching it off:** `/api/remove-totp` refuses super-admins.
 */
const OPERATIONS = ['create', 'read', 'update', 'delete', 'readVersions', 'unlock'] as const

const TOTP_PROVIDER = 'payload-totp/rsc#TOTPProvider'
const OUR_PROVIDER = '/admin/SuperAdminTwoFactorProvider#SuperAdminTwoFactorProvider'

/** Wraps one access rule: a super-admin without their code gets nothing (or only their own
 * account, for reading users). */
export const withSuperAdminCode =
  (rule: Access, ownAccountOnly: boolean): Access =>
  (args) => {
    const user = args.req.user
    if (user && isSuperAdmin(user) && !isFullyAuthenticated(user)) {
      return ownAccountOnly ? { id: { equals: user.id } } : false
    }
    return rule(args)
  }

const refuseForSuperAdmins = (endpoint: Endpoint): Endpoint => ({
  ...endpoint,
  handler: async (req) => {
    if (isSuperAdmin(req.user)) {
      throw publicError('Two-factor login can’t be switched off for platform administrators.', 403)
    }
    return endpoint.handler(req)
  },
})

export const superAdminTwoFactor: Plugin = (config: Config): Config => {
  const collections = (config.collections ?? []).map((collection) => {
    const access = { ...collection.access }
    for (const op of OPERATIONS) {
      const rule = access[op]
      if (typeof rule === 'function') {
        access[op] = withSuperAdminCode(
          rule as Access,
          collection.slug === 'users' && op === 'read',
        )
      }
    }
    return { ...collection, access }
  })
  const globals = (config.globals ?? []).map((global) => {
    const access = { ...global.access }
    for (const op of ['read', 'update', 'readVersions'] as const) {
      const rule = access[op]
      if (typeof rule === 'function') access[op] = withSuperAdminCode(rule as Access, false)
    }
    return { ...global, access }
  })

  let removeFound = false
  const endpoints = (config.endpoints ?? []).map((endpoint) => {
    if (endpoint.path !== '/remove-totp') return endpoint
    removeFound = true
    return refuseForSuperAdmins(endpoint)
  })

  let providerFound = false
  const providers = (config.admin?.components?.providers ?? []).map((provider) => {
    if (typeof provider === 'string') {
      if (provider !== TOTP_PROVIDER) return provider
      providerFound = true
      return OUR_PROVIDER
    }
    if (!provider || provider.path !== TOTP_PROVIDER) return provider
    providerFound = true
    return { ...provider, path: OUR_PROVIDER }
  })
  if (!removeFound || !providerFound) {
    throw new Error('superAdminTwoFactor: payload-totp not found; it must run after payloadTotp')
  }
  return {
    ...config,
    collections,
    globals,
    endpoints,
    admin: { ...config.admin, components: { ...config.admin?.components, providers } },
  }
}
