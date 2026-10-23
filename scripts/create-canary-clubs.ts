/**
 * Creates the hidden canary clubs for the live isolation canary (docs/operations/canary.md).
 * Run with:  pnpm create-canary-clubs
 *
 * Running this against PRODUCTION needs Dan's explicit approval. It prints canary A's editor
 * password once: put it straight into Vercel (CANARY_EDITOR_PASSWORD) and the password manager.
 */
import { ask, chooseDatabase, connect, fail } from './lib/prompts'

const main = async () => {
  console.log('Create the hidden canary clubs\n')
  await chooseDatabase('create the canary clubs')
  const email = await ask('\nEmail address for canary A’s editor (an inbox you control): ')
  if (!email.includes('@')) fail('That does not look like an email address.')
  const payload = await connect()
  const { createCanaryClubs } = await import('../src/canary/setup')
  try {
    const { password } = await createCanaryClubs(payload, email)
    console.log('\nCanary clubs created. Canary A’s editor password (shown once):\n')
    console.log(`  ${password}\n`)
    console.log('Set CANARY_EDITOR_EMAIL and CANARY_EDITOR_PASSWORD in Vercel (production only).')
  } catch (error) {
    fail(`Could not create them: ${(error as Error).message}`)
  }
  process.exit(0)
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await main()
