import { describe, expect, it } from 'vitest'

import { Courses } from '../../src/collections/Courses'

type FieldLike = { name?: string; fields?: FieldLike[]; validate?: (v: unknown) => unknown }

const holeVideo = (): FieldLike => {
  const holes = (Courses.fields as FieldLike[]).find((f) => f.name === 'holes')
  const video = holes?.fields?.find((f) => f.name === 'video')
  if (!video) throw new Error('holes.video field missing')
  return video
}

describe('hole video field', () => {
  it('is optional: empty or missing passes', () => {
    const { validate } = holeVideo()
    expect(validate?.('')).toBe(true)
    expect(validate?.('  ')).toBe(true)
    expect(validate?.(undefined)).toBe(true)
    expect(validate?.(null)).toBe(true)
  })
  it('accepts YouTube and Vimeo addresses', () => {
    const { validate } = holeVideo()
    expect(validate?.('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
    expect(validate?.('https://vimeo.com/123456789')).toBe(true)
  })
  it('rejects any other address with a plain message', () => {
    const { validate } = holeVideo()
    expect(typeof validate?.('https://example.com/video.mp4')).toBe('string')
    expect(typeof validate?.('not a link')).toBe('string')
  })
})
