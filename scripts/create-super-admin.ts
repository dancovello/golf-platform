/**
 * Creates a super-admin account. Run with:  pnpm create-super-admin
 *
 * Everything is typed in at the prompts, so no address or password ends up in a file or in
 * your shell history. Running this against PRODUCTION needs Dan's explicit approval.
 */
import { createInterface } from 'node:readline'

const ask = (question: string, { hidden = false } = {}) =>
  new Promise<string>((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    if (hidden) {
      // Print the question, then echo nothing while the answer is typed.
      ;(rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s) => {
        if (s.includes(question)) process.stdout.write(question)
      }
    }
    rl.question(question, (answer) => {
      rl.close()
      if (hidden) process.stdout.write('\n')
      resolve(answer.trim())
    })
  })

const fail = (message: string): never => {
  console.error(`\n${message}\nNothing was created.`)
  process.exit(1)
}

const main = async () => {
  console.log('Create a super-admin account\n')

  const url = await ask(
    'Database connection string (hidden; press Enter for your local .env database): ',
    { hidden: true },
  )
  if (url) process.env.DATABASE_URL = url
  if (!process.env.DATABASE_URL) fail('No database connection string.')

  let host: string
  let database: string
  try {
    const parsed = new URL(process.env.DATABASE_URL as string)
    host = parsed.hostname
    database = parsed.pathname.replace(/^\//, '')
  } catch {
    return fail('That is not a valid database connection string.')
  }

  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(host)
  console.log(`\nThis will create a super-admin in database "${database}" on ${host}.`)
  if (!isLocal) {
    console.log("This is a cloud database. If it is PRODUCTION, you need Dan's explicit approval.")
  }
  const confirmWord = host.split('.')[0]
  const typed = await ask(`Type "${confirmWord}" to continue: `)
  if (typed !== confirmWord) fail('Confirmation did not match.')

  const email = await ask('\nEmail address: ')
  if (!email.includes('@')) fail('That does not look like an email address.')
  const password = await ask('Password (hidden, at least 12 characters): ', { hidden: true })
  const again = await ask('Same password again (hidden): ', { hidden: true })
  if (password !== again) fail('The passwords did not match.')

  // Imported only now, so the app connects to the database chosen above.
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const { createSuperAdmin } = await import('../src/accounts/createSuperAdmin')
  const payload = await getPayload({ config: await config })

  try {
    await createSuperAdmin(payload, { email, password })
  } catch (error) {
    fail(`Could not create the account: ${(error as Error).message}`)
  }
  console.log(`\nSuper-admin ${email} created. You can now log in at /admin.`)
  process.exit(0)
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await main()
