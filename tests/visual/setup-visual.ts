import { execFileSync } from 'node:child_process'

import { test as setup } from '@playwright/test'

// Runs after the main setup (which resets the database), adding the picture-check clubs.
setup('seed the picture-check clubs', () => {
  execFileSync('node_modules/.bin/payload', ['run', 'tests/visual/seed-visual.ts'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
  })
})
