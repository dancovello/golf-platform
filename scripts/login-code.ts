/**
 * Gives an account a one-time sign-in code, shown here instead of emailed. For when email is down
 * and someone must get into the admin. Run with:  pnpm login-code
 *
 * It works like the emailed code (once, 10 minutes, five wrong tries lock the account), but it
 * still needs the account's password. Running it against PRODUCTION needs Dan's explicit approval.
 */
import { ask, chooseDatabase, connect, fail } from './lib/prompts'

const main = async () => {
  console.log('One-time sign-in code\n')
  await chooseDatabase('make a one-time sign-in code')

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

  if ((await ask(`Make a sign-in code for ${email} (${user.role})? Type "code": `)) !== 'code') {
    fail('Not confirmed.')
  }
  const { newCode, storeCode } = await import('../src/auth/emailCode')
  const code = newCode()
  await storeCode(payload, user.id, code)
  console.log(`\nSign-in code for ${email}: ${code}`)
  console.log('It works once and expires in 10 minutes. They still need their password.')
  process.exit(0)
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await main()
