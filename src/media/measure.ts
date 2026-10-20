import { after } from 'next/server'
import type { CollectionBeforeChangeHook, Payload } from 'payload'
import sharp from 'sharp'

import { luminance } from '../theme/colour'

/** What the site needs to know about an image's colours to keep text and logos legible. */
export type ImageTone = {
  /** The colour of its brightest areas (90th percentile): how much a photo needs shading. */
  bright: string
  /** The average colour of its visible pixels: whether a logo is light or dark. */
  average: string
}

const hex = (rgb: number[]) =>
  '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')

/**
 * Measures an image from a 24×24 copy, so each sample is an area rather than a pixel: a small
 * highlight doesn't count as bright, a bright sky does. Transparent pixels (a logo's
 * background) are left out. Null if the file can't be read as an image.
 */
export const measureImage = async (file: Buffer): Promise<ImageTone | null> => {
  try {
    const { data, info } = await sharp(file)
      .resize(24, 24, { fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const samples: number[][] = []
    for (let i = 0; i < data.length; i += info.channels) {
      if (data[i + 3] >= 128) samples.push([data[i], data[i + 1], data[i + 2]])
    }
    if (samples.length === 0) return null
    const ranked = samples
      .map((rgb) => ({ rgb, lum: luminance(hex(rgb)) }))
      .sort((a, b) => a.lum - b.lum)
    const bright = ranked[Math.min(ranked.length - 1, Math.floor(ranked.length * 0.9))].rgb
    const average = [0, 1, 2].map((c) => samples.reduce((sum, s) => sum + s[c], 0) / samples.length)
    return { bright: hex(bright), average: hex(average) }
  } catch {
    return null
  }
}

/**
 * Media: measures each new or replaced image. Otherwise keeps the stored measurement, so it
 * can only ever come from the file itself.
 */
export const measureUpload: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const file = req.file
  const unmeasured = { bright: null, average: null }
  if (file?.data && String(file.mimetype).startsWith('image/')) {
    data.tone = (await measureImage(file.data)) ?? unmeasured
  } else {
    data.tone = originalDoc?.tone ?? unmeasured
  }
  return data
}

type Unmeasured = {
  id: string | number
  url?: string | null
  mimeType?: string | null
  tone?: { bright?: string | null; average?: string | null } | null
  sizes?: Record<string, { url?: string | null } | undefined> | null
}

/**
 * Images uploaded before measuring existed: measured from their public file once the page has
 * been sent, so the next visit uses the result (until then the site assumes a bright photo).
 * Stored directly, without the upload hooks, as only the measurement changes. Does nothing
 * outside a page request (tests, the search index).
 */
export const measureMissing = (payload: Payload, docs: Unmeasured[]) => {
  const missing = docs
    .filter((d) => !d.tone?.bright && String(d.mimeType ?? '').startsWith('image/'))
    .slice(0, 12)
  if (missing.length === 0) return
  try {
    after(async () => {
      for (const doc of missing) {
        const url = doc.sizes?.w640?.url ?? doc.url
        if (!url) continue
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
          if (!response.ok) continue
          const tone = await measureImage(Buffer.from(await response.arrayBuffer()))
          if (tone) {
            await payload.db.updateOne({ collection: 'media', id: doc.id, data: { tone } })
          }
        } catch (error) {
          payload.logger.warn({ err: error, id: doc.id }, 'Could not measure an older image')
        }
      }
    })
  } catch {
    // Not in a page request.
  }
}
