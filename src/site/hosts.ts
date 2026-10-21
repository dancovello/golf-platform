/**
 * Web addresses (host names) for club sites on their own domains (build step 4).
 *
 * Kept free of imports so src/proxy.ts can use it: the proxy runs before every request and
 * shouldn't load Payload or the database.
 */

/** A host name: lower-case labels of letters, numbers and dashes, separated by dots. */
const HOST =
  /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

/**
 * Tidies what someone typed or what a request sent into a bare host name: lower case, no
 * "https://", path, port or trailing dot. "https://WWW.Club.co.uk/about" → "www.club.co.uk".
 */
export const normaliseHost = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/[/?#].*$/, '')
    .replace(/:\d+$/, '')
    .replace(/\.$/, '')

/** The platform's own addresses, which never belong to a club. */
export const isPlatformHost = (host: string, adminURL = process.env.ADMIN_URL): boolean => {
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return true
  // Vercel's own addresses: staging, pull-request previews and production before step 4.
  if (host.endsWith('.vercel.app')) return true
  if (adminURL) {
    try {
      if (normaliseHost(new URL(adminURL).host) === host) return true
    } catch {
      // A malformed ADMIN_URL is ignored here (password reset reports it).
    }
  }
  return false
}

/**
 * The company website's addresses (the marketing site), from MARKETING_HOSTS: comma-separated,
 * main address first, e.g. "brandname.golf,www.brandname.golf". The others forward to the main
 * one. Empty until the company domain exists; staging and previews show the marketing site on
 * the platform's own address instead (src/proxy.ts).
 */
export const marketingHosts = (value = process.env.MARKETING_HOSTS): string[] =>
  (value ?? '')
    .split(',')
    .map(normaliseHost)
    .filter((host) => HOST.test(host))

export const isMarketingHost = (host: string, value = process.env.MARKETING_HOSTS): boolean =>
  marketingHosts(value).includes(host)

/** Why an address can't be used for a club, or null if it can. */
export const hostProblem = (host: string): string | null => {
  if (!HOST.test(host)) {
    return 'Enter a web address like "www.yourclub.co.uk" (letters, numbers, dashes and dots).'
  }
  if (isPlatformHost(host)) return 'This address belongs to the platform itself.'
  if (isMarketingHost(host)) return "This address belongs to the company's own website."
  return null
}
