/**
 * Read-only proof that the release's Vercel token can do what a production release needs, so a
 * broken token or setting fails BEFORE the release changes the database (the 10 Nov 2026
 * release failed after it). Run by the `vercel-access` job in `.github/workflows/release.yml`
 * and by `.github/workflows/vercel-access.yml`:
 *
 *   node scripts/vercel-access-check.ts
 *
 * Environment: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, and LIVE_URL (production only).
 * Set PROMOTE_LIVE_TO_ITSELF=true to also run the switch-on request on the version that is
 * already live (changes nothing: the live address keeps serving the same version).
 */
import { appendFileSync } from 'node:fs'

import { checkAccess, liveDeploymentId, promoteDeployment } from './lib/vercelApi.ts'

const required = (name: string): string => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}
const summary = (line: string) => {
  console.log(line)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`)
}

try {
  const access = {
    token: required('VERCEL_TOKEN'),
    orgId: required('VERCEL_ORG_ID'),
    projectId: required('VERCEL_PROJECT_ID'),
  }
  const liveUrl = process.env.LIVE_URL?.trim() || undefined
  const seen = await checkAccess(access, liveUrl)
  summary(
    `Vercel access works: project "${seen.project}"${seen.live ? `, live version ${seen.live}` : ''}.`,
  )
  if (process.env.PROMOTE_LIVE_TO_ITSELF === 'true') {
    if (!liveUrl) throw new Error('PROMOTE_LIVE_TO_ITSELF needs LIVE_URL')
    const id = await liveDeploymentId(access, liveUrl)
    await promoteDeployment(access, id)
    summary(`The switch-on request works (re-promoted the version that was already live: ${id}).`)
  }
} catch (error) {
  summary(
    `Vercel access check FAILED: ${error instanceof Error ? error.message : String(error)}. Nothing was changed. Fix the Vercel token or settings (docs/operations/github-environments.md) before releasing.`,
  )
  process.exit(1)
}
