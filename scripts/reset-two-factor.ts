/**
 * Switches a club editor who still has the old authenticator app back to a password alone.
 * Run with:  pnpm reset-two-factor
 *
 * Nobody can set the authenticator up any more (the sign-in code is emailed since 3 Nov), and
 * super-admins always use the emailed code, so this only matters for editors who set it up
 * earlier. A super-admin can also do it in the admin. Running it against PRODUCTION needs Dan's
 * explicit approval. If email is down, use  pnpm login-code  instead.
 */
import { ask, chooseDatabase, connect, fail } from './lib/prompts'

const main = async () => {
  console.log('Reset two-factor login\n')
  await chooseDatabase('switch an editor back to a password alone')

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
  if (user.role === 'super-admin') {
    fail(
      'Super-admins always sign in with an emailed code, so there is nothing to reset. If email is down, run: pnpm login-code',
    )
  }

  if ((await ask(`Switch ${email} back to a password alone? Type "reset": `)) !== 'reset') {
    fail('Not confirmed.')
  }
  const { resetTwoFactor } = await import('../src/auth/resetTwoFactor')
  await resetTwoFactor(payload, user.id)
  console.log(`\nDone. ${email} now signs in with their password alone.`)
  process.exit(0)
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await main()
