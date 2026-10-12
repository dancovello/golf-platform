import type { Field } from 'payload'

import { type BlockRef, idOf } from './types'

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/** A photo field, images only. */
export const imageField = (
  name: string,
  label: string,
  required = true,
  extra: Partial<Field> = {},
): Field =>
  ({
    name,
    label,
    type: 'upload',
    relationTo: 'media',
    required,
    filterOptions: { mimeType: { in: IMAGE_TYPES } },
    ...extra,
  }) as Field

/** The "Design style" select every block starts with. */
export const styleField = (options: { label: string; value: string }[]): Field => ({
  name: 'style',
  label: 'Design style',
  type: 'select',
  required: true,
  defaultValue: options[0].value,
  options,
})

/** Collects refs for photo fields and link fields (`{ type, page }`) at the given paths. */
export const collectRefs = (
  block: Record<string, unknown>,
  path: string,
  { images = [], links = [] }: { images?: string[]; links?: string[] },
): BlockRef[] => {
  const refs: BlockRef[] = []
  for (const key of images) {
    const id = idOf(block[key])
    if (id) refs.push({ collection: 'media', id, path: `${path}.${key}` })
  }
  for (const key of links) {
    const l = (block[key] ?? {}) as { type?: string; page?: unknown }
    const id = l.type === 'url' ? null : idOf(l.page)
    if (id) refs.push({ collection: 'pages', id, path: `${path}.${key}.page` })
  }
  return refs
}

/** Same, for each row of an array field. */
export const collectArrayRefs = (
  block: Record<string, unknown>,
  path: string,
  arrayName: string,
  fields: { images?: string[]; links?: string[] },
): BlockRef[] =>
  (Array.isArray(block[arrayName]) ? (block[arrayName] as Record<string, unknown>[]) : []).flatMap(
    (row, i) => collectRefs(row, `${path}.${arrayName}.${i}`, fields),
  )
