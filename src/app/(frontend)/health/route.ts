// Liveness check for external uptime monitoring. Deliberately reveals nothing about
// tenants, versions or configuration.
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
}
