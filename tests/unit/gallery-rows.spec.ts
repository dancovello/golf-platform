import { describe, expect, it } from 'vitest'

import { rowSizes } from '@/site/blocks/GalleryView'

describe('gallery grid rows', () => {
  it('keeps a few photos on one row', () => {
    expect(rowSizes(1, 4)).toEqual([1])
    expect(rowSizes(2, 4)).toEqual([2])
    expect(rowSizes(4, 4)).toEqual([4])
  })
  it('evens out a short last row so no photo is alone', () => {
    expect(rowSizes(5, 4)).toEqual([3, 2])
    expect(rowSizes(6, 4)).toEqual([3, 3])
    expect(rowSizes(7, 4)).toEqual([4, 3])
    expect(rowSizes(9, 4)).toEqual([4, 3, 2])
    expect(rowSizes(4, 3)).toEqual([2, 2])
  })
  it('leaves full rows alone', () => {
    expect(rowSizes(12, 4)).toEqual([4, 4, 4])
    expect(rowSizes(8, 4)).toEqual([4, 4])
  })
})
