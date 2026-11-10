/**
 * Builds the new version with Vercel and, for production, switches it on only once it works
 * (scripts/lib/safeRelease.ts). Run by the `deploy` job in `.github/workflows/release.yml`:
 *
 *   node scripts/release-deploy.ts
 *
 * Settings come from environment variables:
 *   ENVIRONMENT   "production" or "staging"
 *   VERCEL_CLI    e.g. vercel@63.1.2
 *   VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID   read by the Vercel CLI itself
 *   LIVE_URL      production only: the live address, e.g. https://app.a1engine.co
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'

import { ReleaseFailed, safeRelease } from './lib/safeRelease.ts'

const required = (name: string): string => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const environment = required('ENVIRONMENT')
const cli = required('VERCEL_CLI')
const staged = environment === 'production'
const summary = (line: string) => {
  console.log(line)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`)
}

// The token is read from the environment, never put on the command line.
const vercel = (args: string[]) =>
  execFileSync('npx', ['--yes', cli, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  })

const sleep = (seconds: number) => new Promise((resolve) => setTimeout(resolve, seconds * 1000))

const retry = async (times: number, seconds: number, attempt: () => Promise<boolean>) => {
  for (let i = 0; i < times; i++) {
    if (await attempt()) return true
    if (i < times - 1) await sleep(seconds)
  }
  return false
}

const isOk = (body: string) => /"status"\s*:\s*"ok"/.test(body)

try {
  const result = await safeRelease(
    {
      deploy: async (keepLiveAddress) => {
        const target = staged ? 'production' : 'staging'
        const flags = keepLiveAddress ? ['--skip-domain'] : []
        return vercel(['deploy', '--yes', `--target=${target}`, ...flags])
          .trim()
          .split('\n')
          .pop()!
      },
      // `vercel curl` reaches a deployment's private address. A `--token` flag would be handed on
      // to curl itself, so the full address is passed instead (as the old check did).
      checkDeployment: (url) =>
        retry(5, 10, async () => {
          try {
            return isOk(vercel(['curl', `${url}/health/database`, '--yes', '--', '--silent']))
          } catch {
            return false
          }
        }),
      currentLive: async () => {
        try {
          const info = JSON.parse(vercel(['inspect', required('LIVE_URL'), '--format', 'json']))
          return (info.id ?? info.uid ?? info.url) as string | undefined
        } catch {
          return undefined
        }
      },
      promote: async (url) => {
        vercel(['promote', url, '--yes', '--timeout', '3m'])
      },
      checkLive: () =>
        retry(5, 6, async () => {
          try {
            const response = await fetch(`${required('LIVE_URL')}/health/database`, {
              cache: 'no-store',
              signal: AbortSignal.timeout(20_000),
            })
            return response.ok && isOk(await response.text())
          } catch {
            return false
          }
        }),
      rollback: async (to) => {
        vercel(['rollback', to, '--yes', '--timeout', '3m'])
      },
      log: summary,
    },
    { staged },
  )
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `url=${result.url}\n`)
  summary(
    result.promoted
      ? `Deployed and switched on ${environment}: ${result.url}`
      : `Deployed ${environment}: ${result.url}`,
  )
} catch (error) {
  summary(error instanceof ReleaseFailed ? error.message : `The deploy failed: ${String(error)}`)
  console.error('See docs/operations/restore-runbook.md and docs/operations/incident-plan.md.')
  process.exit(1)
}
