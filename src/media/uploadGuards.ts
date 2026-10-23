import { randomBytes, randomUUID } from 'node:crypto'

import type { CollectionBeforeOperationHook, Config, Plugin } from 'payload'

import { allowRequest, UPLOAD_LINK_LIMIT } from '../security/rateLimit'

/** "green.png" → "k3f9x2-green.png". */
export const withRandomCode = (filename: string) =>
  `${randomBytes(4).readUInt32BE().toString(36).padStart(6, '0').slice(-6)}-${filename}`

/**
 * Guards the storage plugin's signed-link endpoint (browser uploads), registered after s3Storage.
 *
 * 1. Only the allowed file types get a link. Payload checks that the declared type is *a* valid
 *    type but not that it's on the collection's list, and the file is stored and served with the
 *    declared type, so without this a web page could be uploaded and served as a web page.
 * 2. Every file gets its own new random folder (src/media/folders.ts), chosen here rather than
 *    by the form: a bulk upload shares one form between all its files.
 * 3. Every stored file name starts with a random code, so two clubs never pick the same name.
 *    Payload keeps file names unique by checking every club's files, ignoring access rules:
 *    without the code, club A uploading "hero.jpg" when club B has one gets "hero-1.jpg",
 *    which tells club A that another club exists (CLAUDE.md non-negotiable 2).
 * 4. At most 100 links an hour per account (UPLOAD_LINK_LIMIT), so one account can't fill the
 *    public bucket with large files (uploads audit, finding 2).
 */
export const guardBrowserUploads =
  (endpointPath: string, allowed: Record<string, string[]>): Plugin =>
  (config: Config): Config => ({
    ...config,
    endpoints: (config.endpoints ?? []).map((endpoint) =>
      endpoint.path === endpointPath
        ? {
            ...endpoint,
            handler: async (req) => {
              if (req.user) {
                const db = (
                  req.payload.db as unknown as { drizzle: Parameters<typeof allowRequest>[0] }
                ).drizzle
                const allowed = await allowRequest(
                  db,
                  UPLOAD_LINK_LIMIT,
                  `${req.user.collection}:${req.user.id}`,
                )
                if (!allowed) {
                  return Response.json(
                    { errors: [{ message: 'Too many uploads, try again later.' }] },
                    { status: 429 },
                  )
                }
              }
              const body = (await req.json?.()) as
                { collectionSlug?: unknown; filename?: unknown; mimeType?: unknown } | undefined
              const types =
                typeof body?.collectionSlug === 'string' &&
                Object.hasOwn(allowed, body.collectionSlug)
                  ? allowed[body.collectionSlug]
                  : null
              if (
                !body ||
                !types ||
                typeof body.mimeType !== 'string' ||
                !types.includes(body.mimeType) ||
                typeof body.filename !== 'string'
              ) {
                return Response.json(
                  { errors: [{ message: 'This type of file can’t be uploaded.' }] },
                  { status: 400 },
                )
              }
              // A new random folder for every file, whatever the form sent: a bulk upload
              // copies one form for all its files, so they all asked for the same folder and
              // every file after the first was refused (the "prefix" error, 2026-10-17).
              const renamed = {
                ...body,
                filename: withRandomCode(body.filename),
                docPrefix: `${body.collectionSlug}/${randomUUID()}`,
              }
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
