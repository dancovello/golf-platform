/**
 * Creates a super-admin account. Run with:  pnpm create-super-admin
 *
 * Everything is typed in at the prompts, so no address or password ends up in a file or in
 * your shell history. Running this against PRODUCTION needs Dan's explicit approval.
 *
 * Use the database's OWNER connection string (on Neon, the direct one the release uses), not
 * the website's golf_app account: since 23 Oct 2026 the database refuses a super-admin from any
 * other account (migration 20261023_120000_app_role_limits).
 */
import { ask, chooseDatabase, connect, fail } from './lib/prompts'

const main = async () => {
  console.log('Create a super-admin account\n')
  await chooseDatabase('create a super-admin')

  const email = await ask('\nEmail address: ')
  if (!email.includes('@')) fail('That does not look like an email address.')
  const password = await ask('Password (hidden, at least 12 characters): ', { hidden: true })
  const again = await ask('Same password again (hidden): ', { hidden: true })
  if (password !== again) fail('The passwords did not match.')

  const payload = await connect()
  const { createSuperAdmin } = await import('../src/accounts/createSuperAdmin')
  try {
    await createSuperAdmin(payload, { email, password })
  } catch (error) {
    fail(`Could not create the account: ${(error as Error).message}`)
  }
  console.log(`\nSuper-admin ${email} created. Log in at /admin and set up your authenticator app.`)
  process.exit(0)
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await main()
