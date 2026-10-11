import { createInterface } from 'node:readline'

export const ask = (question: string, { hidden = false } = {}) =>
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

export const fail = (message: string): never => {
  console.error(`\n${message}\nNothing was changed.`)
  process.exit(1)
}

/**
 * Asks for the database (hidden), shows which one it is, and makes the person type its name.
 * Sets DATABASE_URL so the app connects there when it's imported afterwards.
 */
export const chooseDatabase = async (action: string) => {
  const url = await ask(
    'Database connection string (hidden; press Enter for your local .env database): ',
    { hidden: true },
  )
  if (url) process.env.DATABASE_URL = url
  if (!process.env.DATABASE_URL) fail('No database connection string.')

  let host = ''
  let database = ''
  try {
    const parsed = new URL(process.env.DATABASE_URL as string)
    host = parsed.hostname
    database = parsed.pathname.replace(/^\//, '')
  } catch {
    fail('That is not a valid database connection string.')
  }

  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(host)
  console.log(`\nThis will ${action} in database "${database}" on ${host}.`)
  if (!isLocal) {
    console.log("This is a cloud database. If it is PRODUCTION, you need Dan's explicit approval.")
  }
  const confirmWord = host.split('.')[0]
  if ((await ask(`Type "${confirmWord}" to continue: `)) !== confirmWord) {
    fail('Confirmation did not match.')
  }
}

/** Imported only after chooseDatabase, so the app connects to the chosen database. */
export const connect = async () => {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')
  return getPayload({ config: await config })
}
