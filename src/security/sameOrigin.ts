/**
 * For routes that only the admin itself should call: true when the request says it came from
 * another site. No Origin header is allowed (the sign-in cookie's own checks still apply); an
 * Origin that isn't a web address at all (e.g. "null") counts as another site.
 */
export const fromAnotherSite = (request: Request): boolean => {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).host !== new URL(request.url).host
  } catch {
    return true
  }
}
