import { postgresAdapter } from '@payloadcms/db-postgres'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { payloadTotp } from 'payload-totp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { isSuperAdmin } from './access/roles'
import { guardTenantSelection } from './admin/guardTenantSelection'
import { encryptTotpSecrets } from './auth/totpSecretEncryption'
import { emailAdapter } from './email/adapter'
import { collections } from './collections'
import { usersAccess } from './collections/Users'
import { DOCUMENT_TYPES } from './collections/Documents'
import { MEDIA_TYPES } from './collections/Media'
import { guardBrowserUploads } from './media/uploadGuards'
import { mediaStorageSettings } from './media/storage'
import { jobs } from './privacy/jobs'
import { addSearchTables } from './search/schema'
import { clubOwnedCollections } from './tenancy'

const media = mediaStorageSettings()

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
  // Background jobs (decided stack: Payload Jobs Queue). Only the nightly clean-up so far.
  jobs,
  // Resend, only when its key is set (src/email/adapter.ts).
  email: emailAdapter(),
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
    // The site search index: two plain tables only the website's server code reads
    // (src/search/schema.ts).
    afterSchemaInit: [addSearchTables],
    // Search's spelling tolerance needs pg_trgm. Migrations add it everywhere else (the
    // website's own account can't); locally, schema auto-sync needs it first.
    extensions: process.env.NODE_ENV === 'development' ? ['pg_trgm'] : [],
  }),
  telemetry: false,
  // Makes the smaller photo copies (src/collections/Media.ts).
  sharp,
  // Largest photo or video an editor can add (50 MB). Checked before the upload starts.
  upload: { limits: { fileSize: 50 * 1024 * 1024 } },
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
      // The Clubs list shows every club to the super-admin, not just the one picked in the club
      // selector (it hid new clubs, e.g. the demo club). Editors can't open the Clubs list, and
      // can only ever read their own club (Tenants.access).
      useTenantsListFilter: false,
      // Deleting a club is refused by the database while it has accounts or content.
      cleanupAfterTenantDelete: false,
    }),
    // Photos and videos go straight from the browser to storage (Vercel refuses request
    // bodies over 4.5 MB), each in its own random folder (src/collections/Media.ts).
    s3Storage({
      bucket: media.bucket,
      config: media.config,
      clientUploads: true,
      collections: {
        media: {
          prefix: 'media',
          // Served from the public storage domain, not through the app.
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) => `${media.publicURL}/${prefix}/${filename}`,
        },
        documents: {
          prefix: 'documents',
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) => `${media.publicURL}/${prefix}/${filename}`,
        },
      },
    }),
    // Must come after s3Storage, whose signed-link endpoint it wraps.
    guardBrowserUploads('/storage-s3-generate-signed-url', {
      media: MEDIA_TYPES,
      documents: DOCUMENT_TYPES,
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
