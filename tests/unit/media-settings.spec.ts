import { afterEach, describe, expect, it } from 'vitest'

import { mediaStorageSettings } from '@/media/storage'

const saved = { ...process.env }
afterEach(() => {
  process.env = { ...saved }
})

describe('photo storage settings', () => {
  it('ignores spaces and line breaks pasted around a value', () => {
    process.env.MEDIA_S3_ACCESS_KEY_ID = 'abc123\n\n'
    process.env.MEDIA_S3_SECRET_ACCESS_KEY = '  secret\r\n'
    process.env.MEDIA_PUBLIC_URL = 'https://pub-x.r2.dev/\n'
    const s = mediaStorageSettings()
    expect(s.config.credentials).toEqual({ accessKeyId: 'abc123', secretAccessKey: 'secret' })
    expect(s.publicURL).toBe('https://pub-x.r2.dev')
  })

  it('refuses a value that is only whitespace', () => {
    process.env.MEDIA_S3_BUCKET = ' \n'
    expect(() => mediaStorageSettings()).toThrow(/MEDIA_S3_BUCKET/)
  })
})
