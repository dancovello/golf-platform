import { postgresAdapter } from '@payloadcms/db-postgres'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { isSuperAdmin } from './access/roles'
import { collections } from './collections'
import { usersAccess } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const requireEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export default buildConfig({
  admin: {
    user: 'users',
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
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  telemetry: false,
  plugins: [
    multiTenantPlugin({
      tenantsSlug: 'tenants',
      collections: {
        pages: {},
        'club-settings': { isGlobal: true },
      },
      // Users store exactly one club in `tenant`; see src/collections/Users.ts.
      tenantsArrayField: { includeDefaultField: false },
      userHasAccessToAllTenants: (user) => isSuperAdmin(user),
      // Our own Users access rules already scope editors to their club, so use them as-is
      // instead of the plugin's array-based constraint.
      usersAccessResultOverride: (args) => {
        const fn = usersAccess[args.accessKey as keyof typeof usersAccess]
        return typeof fn === 'function' ? fn(args as never) : false
      },
      useUsersTenantFilter: false,
      // Deleting a club is blocked while it has accounts or content (foreign keys).
      cleanupAfterTenantDelete: false,
    }),
  ],
})
