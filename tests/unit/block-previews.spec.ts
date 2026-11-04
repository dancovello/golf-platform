import { describe, expect, it } from 'vitest'

import { blockDefinitions, pageBlocks } from '@/blocks'
import { blockPreview } from '@/blocks/previews'

describe('the "Add block" pictures', () => {
  it('every block a club can add has its own wireframe', () => {
    const missing = blockDefinitions
      .filter((d) => !blockPreview(d.config.slug))
      .map((d) => d.config.slug)
    expect(missing).toEqual([])
  })

  it('each wireframe is a valid image address handed to Payload', () => {
    for (const block of pageBlocks) {
      const url = block.admin?.images?.thumbnail
      expect(typeof url === 'object' && url.url.startsWith('data:image/svg+xml')).toBe(true)
    }
  })
})
