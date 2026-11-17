import { describe, expect, it } from 'vitest'

import { dropEmptyPictures } from '../../src/blocks/richText/lexical'

const doc = (children: unknown[]) => ({ root: { type: 'root', children } })

describe('pasted pictures from Word (QA-37)', () => {
  it('drops a picture with no photo behind it, so the page can still be published', () => {
    const value = doc([
      { type: 'paragraph', children: [{ type: 'text', text: 'Hello' }] },
      { type: 'upload', relationTo: 'media', value: null },
      { type: 'upload', relationTo: 'media', value: '' },
    ])
    const out = dropEmptyPictures(value) as ReturnType<typeof doc>
    expect(out.root.children).toHaveLength(1)
  })

  it('keeps a real photo chosen with the photo button', () => {
    const value = doc([{ type: 'upload', relationTo: 'media', value: 'abc-123' }])
    expect(dropEmptyPictures(value)).toEqual(value)
  })

  it('leaves empty or missing content alone', () => {
    expect(dropEmptyPictures(null)).toBeNull()
    expect(dropEmptyPictures(doc([]))).toEqual(doc([]))
  })
})
