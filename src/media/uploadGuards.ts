import { randomBytes } from 'node:crypto'

import type { CollectionBeforeOperationHook, Config, Plugin } from 'payload'

/** "green.png" → "k3f9x2-green.png". */
export const withRandomCode = (filename: string) =>
  `${randomBytes(4).readUInt32BE().toString(36).padStart(6, '0').slice(-6)}-${filename}`

/**
 * Guards the storage plugin's signed-link endpoint (browser uploads), registered after s3Storage.
 *
 * 1. Only the allowed file types get a link. Payload checks that the declared type is *a* valid
 *    type but not that it's on the collection's list, and the file is stored and served with the
 *    declared type, so without this a web page could be uploaded and served as a web page.
 * 2. Every stored file name starts with a random code, so two clubs never pick the same name.
 *    Payload keeps file names unique by checking every club's files, ignoring access rules:
 *    without the code, club A uploading "hero.jpg" when club B has one gets "hero-1.jpg",
 *    which tells club A that another club exists (CLAUDE.md non-negotiable 2).
 */
export const guardBrowserUploads =
  (endpointPath: string, allowed: { collectionSlug: string; mimeTypes: string[] }): Plugin =>
  (config: Config): Config => ({
    ...config,
    endpoints: (config.endpoints ?? []).map((endpoint) =>
      endpoint.path === endpointPath
        ? {
            ...endpoint,
            handler: async (req) => {
              const body = (await req.json?.()) as
                { collectionSlug?: unknown; filename?: unknown; mimeType?: unknown } | undefined
              if (
                !body ||
                body.collectionSlug !== allowed.collectionSlug ||
                typeof body.mimeType !== 'string' ||
                !allowed.mimeTypes.includes(body.mimeType) ||
                typeof body.filename !== 'string'
              ) {
                return Response.json(
                  { errors: [{ message: 'This type of file can’t be uploaded.' }] },
                  { status: 400 },
                )
              }
              const renamed = { ...body, filename: withRandomCode(body.filename) }
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
