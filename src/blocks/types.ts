import type { Block } from 'payload'

/** A page or photo a block points at, with where it was found (for error messages). */
export type BlockRef = { collection: 'pages' | 'media' | 'documents'; id: string; path: string }

export const idOf = (value: unknown): string | null => {
  if (typeof value === 'string' && value) return value
  if (value && typeof value === 'object' && 'id' in value)
    return String((value as { id: unknown }).id)
  return null
}

/**
 * A block's CMS side: its fields, and every page or photo it can point at. The website side
 * (component and data loading) lives in src/site/blocks, so the CMS never loads site code.
 */
export type BlockDefinition = {
  config: Block
  /** `path` is the block's own path in the document, e.g. "layout.0". */
  refs: (block: Record<string, unknown>, path: string) => BlockRef[]
}
