/**
 * Resets an account's two-factor login (lost phone), so they set it up again at their next
 * login. Run with:  pnpm reset-two-factor
 *
 * Club editors can also be reset by a super-admin in the admin. This script is the only way to
 * reset a SUPER-ADMIN. Running it against PRODUCTION needs Dan's explicit approval.
 */
import { ask, chooseDatabase, connect, fail } from './lib/prompts'

const main = async () => {
  console.log('Reset two-factor login\n')
  await chooseDatabase('reset an account’s two-factor login')

  const email = await ask('\nEmail address of the account: ')
  const payload = await connect()
  const found = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    depth: 0,
    limit: 1,
  })
  const user = found.docs[0]
  if (!user) fail(`No account with the email ${email}.`)

  if ((await ask(`Reset two-factor for ${email} (${user.role})? Type "reset": `)) !== 'reset') {
    fail('Not confirmed.')
  }
  const { resetTwoFactor } = await import('../src/auth/resetTwoFactor')
  await resetTwoFactor(payload, user.id)
  console.log(`\nDone. ${email} will set up their authenticator app at their next login.`)
  process.exit(0)
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await main()
