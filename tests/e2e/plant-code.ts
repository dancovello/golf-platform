/**
 * Plants the known test sign-in code (TEST_CODE) for one account, as if its email had just been
 * sent. Run with:  payload run tests/e2e/plant-code.ts <email>
 * The browser tests use it because they can't read an inbox (tests/e2e/code.ts).
 */
import { getPayload } from 'payload'

import { storeCode } from '@/auth/emailCode'
import config from '@/payload.config'

import { TEST_CODE } from '../shared/totp'

const email = process.argv.at(-1) ?? ''
const payload = await getPayload({ config })
const found = await payload.find({
  collection: 'users',
  where: { email: { equals: email } },
  depth: 0,
  limit: 1,
  overrideAccess: true,
})
const user = found.docs[0]
if (!user) {
  console.error(`No account with the email ${email}`)
  process.exit(1)
}
await storeCode(payload, user.id, TEST_CODE)
process.exit(0)
