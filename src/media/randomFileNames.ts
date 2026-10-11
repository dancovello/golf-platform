import { randomBytes } from 'node:crypto'

import type { CollectionBeforeOperationHook, Config, Plugin } from 'payload'

/** "green.png" → "k3f9x2-green.png". */
export const withRandomCode = (filename: string) =>
  `${randomBytes(4).readUInt32BE().toString(36).padStart(6, '0').slice(-6)}-${filename}`

/**
 * Every stored file name starts with a random code, so two clubs never pick the same name.
 *
 * Why: Payload keeps file names unique by checking every club's files, ignoring access rules.
 * Without the code, club A uploading "hero.jpg" when club B already has one gets "hero-1.jpg",
 * which tells club A that another club exists (CLAUDE.md non-negotiable 2).
 *
 * Browser uploads choose their name in the storage plugin's signed-link endpoint; this plugin
 * (registered after s3Storage) renames there. Server uploads are renamed by the hook below.
 */
export const randomFileNames =
  (endpointPath: string): Plugin =>
  (config: Config): Config => ({
    ...config,
    endpoints: (config.endpoints ?? []).map((endpoint) =>
      endpoint.path === endpointPath
        ? {
            ...endpoint,
            handler: async (req) => {
              const body = (await req.json?.()) as { filename?: unknown } | undefined
              const renamed =
                body && typeof body.filename === 'string'
                  ? { ...body, filename: withRandomCode(body.filename) }
                  : body
              req.json = async () => renamed
              return endpoint.handler(req)
            },
          }
        : endpoint,
    ),
  })

/** Server uploads (not via a signed link): add the code before Payload picks the name. */
export const randomServerUploadName: CollectionBeforeOperationHook = ({ args, operation }) => {
  const file = args.req?.file
  if (
    operation === 'create' &&
    file &&
    !('clientUploadContext' in file && file.clientUploadContext)
  ) {
    file.name = withRandomCode(file.name)
  }
  return args
}
