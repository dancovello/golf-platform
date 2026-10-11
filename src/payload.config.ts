import { postgresAdapter } from '@payloadcms/db-postgres'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { payloadTotp } from 'payload-totp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { isSuperAdmin } from './access/roles'
import { guardTenantSelection } from './admin/guardTenantSelection'
import { encryptTotpSecrets } from './auth/totpSecretEncryption'
import { collections } from './collections'
import { usersAccess } from './collections/Users'
import { clubOwnedCollections } from './tenancy'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const requireEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// Checked at startup so a missing key stops the app, rather than failing at someone's first login.
if (!/^[0-9a-f]{64}$/i.test(process.env.TOTP_ENCRYPTION_KEY ?? '')) {
  throw new Error('TOTP_ENCRYPTION_KEY must be 64 hex characters (openssl rand -hex 32)')
}

export default buildConfig({
  admin: {
    user: 'users',
    components: {
      views: {
        inviteEditor: {
          Component: '/admin/InviteEditorView#InviteEditorView',
          path: '/invite-editor',
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // Copied so Payload adding its own collections at startup never changes our list.
  collections: [...collections],
  editor: lexicalEditor(),
  // GraphQL is off until it is covered by the tenant-isolation suite (see docs/architecture/decisions.md).
  graphQL: {
    disable: true,
  },
  secret: requireEnv('PAYLOAD_SECRET'),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: requireEnv('DATABASE_URL'),
    },
    // Schema auto-sync ("push") is for local development only. Every other environment,
    // including tests and CI, changes the schema through committed migrations.
    push: process.env.NODE_ENV === 'development',
    // Random IDs, so record numbers never reveal how many clubs or pages exist
    // (docs/plans/step-2-spike-findings.md, finding 3).
    idType: 'uuid',
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  telemetry: false,
  plugins: [
    multiTenantPlugin({
      tenantsSlug: 'tenants',
      collections: { ...clubOwnedCollections },
      // Accounts store exactly one club in `tenant`; see src/collections/Users.ts.
      tenantsArrayField: { includeDefaultField: false },
      userHasAccessToAllTenants: (user) => isSuperAdmin(user),
      // Our own account rules already limit editors to their club. Call the frozen originals:
      // the plugin replaces Users.access in place, so calling that would loop forever
      // (docs/plans/step-2-spike-findings.md, finding 1).
      usersAccessResultOverride: (args) => {
        const fn = usersAccess[args.accessKey as keyof typeof usersAccess]
        return typeof fn === 'function' ? fn(args as never) : false
      },
      useUsersTenantFilter: false,
      // Deleting a club is refused by the database while it has accounts or content.
      cleanupAfterTenantDelete: false,
    }),
    // Keeps the club list from loading before the two-factor code is entered.
    guardTenantSelection,
    // Two-factor login, required for every account (docs/architecture/decisions.md).
    // Must come after the plugins that add collections: it wraps every access rule so nothing
    // is reachable until the code has been entered (or, for new accounts, set up).
    payloadTotp({
      collection: 'users',
      forceSetup: true,
      totp: { issuer: 'Golf Platform' },
      // In a dark admin theme the QR code was drawn light-on-dark with no white border, which
      // many authenticator apps can't scan. Always draw it dark-on-white.
      forceWhiteBackgroundOnQrCode: true,
    }),
    // Must come after payloadTotp, which adds the secret field it encrypts.
    encryptTotpSecrets('users'),
  ],
})
