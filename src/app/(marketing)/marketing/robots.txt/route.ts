import { robotsBody } from '@/marketing/seo'

export const dynamic = 'force-dynamic'

/**
 * The company domain's robots.txt (reached only through src/proxy.ts; the platform's own
 * address keeps src/app/(frontend)/robots.txt). Search engines are welcome on production only.
 */
export function GET() {
  return new Response(robotsBody(process.env.VERCEL_ENV === 'production'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
