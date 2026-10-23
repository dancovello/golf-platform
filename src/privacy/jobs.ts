import type { Config, PayloadRequest } from 'payload'

import { isSuperAdminWithCode } from '../auth/fullyAuthenticated'

import { runCleanUp } from './cleanUp'

/** Only a super-admin with their two-factor code entered may run or queue jobs by hand.
 * Payload's default would let any signed-in account do it. The nightly schedule doesn't go
 * through this: its route checks Vercel's secret and calls the queue directly. */
const superAdminWithCode = ({ req }: { req: PayloadRequest }) => isSuperAdminWithCode(req.user)

export const jobs: NonNullable<Config['jobs']> = {
  access: { run: superAdminWithCode, queue: superAdminWithCode, cancel: superAdminWithCode },
  // Finished jobs leave nothing behind in the database.
  deleteJobOnComplete: true,
  tasks: [
    {
      slug: 'cleanUp',
      label: 'Nightly clean-up (privacy policy promises)',
      retries: 2,
      outputSchema: [
        { name: 'enquiries', type: 'number' },
        { name: 'files', type: 'number' },
      ],
      handler: async ({ req }) => {
        const result = await runCleanUp(req.payload)
        return { output: { enquiries: result.enquiries, files: result.uploads?.removed ?? 0 } }
      },
    },
  ],
}
