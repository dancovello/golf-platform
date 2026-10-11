import { Secret, TOTP } from 'otpauth'

/** Two-factor secret given to seeded test accounts (base32, test-only, never used elsewhere). */
export const TEST_TOTP_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'

/** The 6-digit code an authenticator app would show right now. */
export const currentCode = (secret = TEST_TOTP_SECRET) =>
  new TOTP({
    secret: Secret.fromBase32(secret),
    digits: 6,
    period: 30,
    algorithm: 'SHA1',
  }).generate()
