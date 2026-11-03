import { execFileSync } from 'node:child_process'

export { TEST_CODE } from '../shared/totp'

/** Plants the known sign-in code for an account, as if its email had just arrived. */
export const plantCode = (email: string) =>
  execFileSync('node_modules/.bin/payload', ['run', 'tests/e2e/plant-code.ts', email], {
    stdio: 'inherit',
    env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
  })
