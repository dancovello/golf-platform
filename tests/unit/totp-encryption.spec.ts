import { beforeEach, describe, expect, it } from 'vitest'

import { decryptSecret, encryptSecret } from '@/auth/totpSecretEncryption'

const KEY_A = 'a'.repeat(64)
const KEY_B = 'b'.repeat(64)
const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'

describe('two-factor secret encryption', () => {
  beforeEach(() => {
    process.env.TOTP_ENCRYPTION_KEY = KEY_A
  })

  it('round-trips, and the stored form never contains the secret', () => {
    const stored = encryptSecret(SECRET)
    expect(stored.startsWith('v1:')).toBe(true)
    expect(stored).not.toContain(SECRET)
    expect(decryptSecret(stored)).toBe(SECRET)
  })

  it('encrypts the same secret differently each time', () => {
    expect(encryptSecret(SECRET)).not.toBe(encryptSecret(SECRET))
  })

  it('fails with the wrong key', () => {
    const stored = encryptSecret(SECRET)
    process.env.TOTP_ENCRYPTION_KEY = KEY_B
    expect(() => decryptSecret(stored)).toThrow()
  })

  it('fails if the stored value was tampered with', () => {
    const [prefix, iv, tag, data] = encryptSecret(SECRET).split(':')
    const flipped = Buffer.from(data, 'base64')
    flipped[0] ^= 1
    expect(() => decryptSecret([prefix, iv, tag, flipped.toString('base64')].join(':'))).toThrow()
  })

  it('refuses a shortened tamper-check value (security scan, 26 Oct)', () => {
    const [prefix, iv, tag, data] = encryptSecret(SECRET).split(':')
    const short = Buffer.from(tag, 'base64').subarray(0, 4).toString('base64')
    expect(() => decryptSecret([prefix, iv, short, data].join(':'))).toThrow()
  })

  it('refuses an unencrypted value instead of using it', () => {
    expect(() => decryptSecret(SECRET)).toThrow(/not encrypted/)
  })

  it('refuses to work without a proper key', () => {
    process.env.TOTP_ENCRYPTION_KEY = 'short'
    expect(() => encryptSecret(SECRET)).toThrow(/64 hex/)
  })
})
