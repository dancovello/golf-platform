/**
 * Checking every club's own address (the hourly club-sites cron). Sized for many clubs being
 * down at once, which is the moment the check matters most: 20 at a time, 8 seconds each, so
 * 100 clubs all down take about 40 seconds. If time still runs out, clubs not yet checked are
 * counted and reported rather than silently skipped.
 */
export const TIMEOUT_MS = 8_000
export const AT_A_TIME = 20
/** Stop starting new batches after this long (the route may run for 120 seconds). */
export const BUDGET_MS = 90_000

/** Whether the club's home page loads (any redirect followed). */
export const answers = async (host: string) => {
  try {
    const response = await fetch(`https://${host}/`, {
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': 'A1-Engine-site-check' },
    })
    return response.ok
  } catch {
    return false
  }
}

export const checkClubSites = async (
  hosts: string[],
  { atATime = AT_A_TIME, budgetMs = BUDGET_MS, now = Date.now } = {},
) => {
  const started = now()
  const down: string[] = []
  let checked = 0
  for (let i = 0; i < hosts.length; i += atATime) {
    if (now() - started > budgetMs) break
    const batch = hosts.slice(i, i + atATime)
    const results = await Promise.all(batch.map(answers))
    batch.forEach((host, k) => {
      if (!results[k]) down.push(host)
    })
    checked += batch.length
  }
  return { down, checked, notChecked: hosts.length - checked }
}
