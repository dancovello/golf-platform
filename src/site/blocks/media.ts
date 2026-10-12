import type { Payload } from 'payload'

export type SiteMedia = {
  url: string
  alt: string
  mimeType: string
  width: number | null
  height: number | null
  /** Sizes for <img srcset>, e.g. "…w640.webp 640w, …" (photos only). */
  srcSet: string | null
  /** CSS object-position from the focal point set in the CMS. */
  position: string
}

type MediaDoc = {
  id: string | number
  url?: string | null
  alt?: string | null
  mimeType?: string | null
  width?: number | null
  height?: number | null
  focalX?: number | null
  focalY?: number | null
  sizes?: Record<string, { url?: string | null; width?: number | null } | undefined> | null
}

/** Photos and videos by ID, only if they belong to this club. Anything else is left out. */
export const loadClubMedia = async (
  payload: Payload,
  tenantID: string,
  ids: string[],
): Promise<Map<string, SiteMedia>> => {
  const wanted = [...new Set(ids)]
  if (wanted.length === 0) return new Map()
  const { docs } = await payload.find({
    collection: 'media',
    where: { and: [{ id: { in: wanted } }, { tenant: { equals: tenantID } }] },
    // No `select`: a file's address is worked out from its folder and stored name, so
    // the whole (small) record is needed.
    limit: wanted.length,
    depth: 0,
    overrideAccess: true,
  })
  return new Map(
    (docs as MediaDoc[])
      .filter((d) => typeof d.url === 'string')
      .map((d) => {
        const sizes = Object.values(d.sizes ?? {})
          .filter((s): s is { url: string; width: number } => Boolean(s?.url && s.width))
          .sort((a, b) => a.width - b.width)
        return [
          String(d.id),
          {
            url: String(d.url),
            alt: d.alt ?? '',
            mimeType: d.mimeType ?? '',
            width: d.width ?? null,
            height: d.height ?? null,
            srcSet: sizes.length > 0 ? sizes.map((s) => `${s.url} ${s.width}w`).join(', ') : null,
            position: `${d.focalX ?? 50}% ${d.focalY ?? 50}%`,
          },
        ]
      }),
  )
}
