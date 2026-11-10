import { databaseAnswers } from '@/monitoring/databaseHealth'

// The release check (.github/workflows/release.yml): the new version must reach its database
// before it counts as healthy. Reveals nothing about clubs, versions or configuration.
// Not used by the 5-minute uptime monitor, which stays on /health so Neon can still sleep
// when idle (docs/operations/monitoring.md); the hourly database check covers that.
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  const ok = await databaseAnswers()
  return Response.json(
    { status: ok ? 'ok' : 'database unavailable' },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  )
}
