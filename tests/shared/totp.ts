/** Authenticator secret given to seeded test editors who still have the old authenticator
 * set up (base32, test-only, never used elsewhere). It is no longer used to sign in
 * (decisions.md, 3 Nov); the tests only check it stays encrypted at rest. */
export const TEST_TOTP_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'

/** The emailed sign-in code the tests plant for an account (tests can't read an inbox). */
export const TEST_CODE = '482913'
