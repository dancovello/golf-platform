import type { CSSProperties } from 'react'
import type { Payload } from 'payload'
import { cache } from 'react'

import { measureMissing } from '@/media/measure'

import {
  type Brand,
  BRAND_INPUTS,
  DEFAULT_BRAND,
  deriveTheme,
  isHex,
  photoShade,
} from '@/theme/colour'

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
  /**
   * For text over this photo: the least shading it needs, and the eyebrow colour that reads on
   * it. Put on the element that holds the photo and its text, with the `on-image` class.
   */
  shading: CSSProperties
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
  tone?: { bright?: string | null } | null
}

/** The club's five colours (once per page). */
const clubBrand = cache(async (payload: Payload, tenantID: string): Promise<Brand> => {
  const { docs } = await payload.find({
    collection: 'club-settings',
    where: { tenant: { equals: tenantID } },
    select: { branding: true },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const b = (docs[0]?.branding ?? {}) as Partial<Record<keyof Brand, unknown>>
  return Object.fromEntries(
    BRAND_INPUTS.map((key) => [key, isHex(b[key]) ? b[key] : DEFAULT_BRAND[key]]),
  ) as Brand
})

/** Photos and videos by ID, only if they belong to this club. Anything else is left out. */
export const loadClubMedia = async (
  payload: Payload,
  tenantID: string,
  ids: string[],
): Promise<Map<string, SiteMedia>> => {
  const wanted = [...new Set(ids)]
  if (wanted.length === 0) return new Map()
  const [{ docs }, brand] = await Promise.all([
    payload.find({
      collection: 'media',
      where: { and: [{ id: { in: wanted } }, { tenant: { equals: tenantID } }] },
      // No `select`: a file's address is worked out from its folder and stored name, so
      // the whole (small) record is needed.
      limit: wanted.length,
      depth: 0,
      overrideAccess: true,
    }),
    clubBrand(payload, tenantID),
  ])
  measureMissing(payload, docs as MediaDoc[])
  const theme = deriveTheme(brand)
  return new Map(
    (docs as MediaDoc[])
      .filter((d) => typeof d.url === 'string')
      .map((d) => {
        const sizes = Object.values(d.sizes ?? {})
          .filter((s): s is { url: string; width: number } => Boolean(s?.url && s.width))
          .sort((a, b) => a.width - b.width)
        const { shade, eyebrow } = photoShade(d.tone?.bright, theme, brand)
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
            shading: {
              '--photo-shade': `${shade}%`,
              '--ink-image-eyebrow': eyebrow,
            } as CSSProperties,
          },
        ]
      }),
  )
}
