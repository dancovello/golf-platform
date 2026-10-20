import { robotsResponse } from '@/site/routes/seo'

/** The platform's own address (admin, staging, previews): search engines stay away. Club
 * domains have their own (src/app/(frontend)/sites/[domain]/robots.txt). */
export function GET() {
  return robotsResponse(null)
}
