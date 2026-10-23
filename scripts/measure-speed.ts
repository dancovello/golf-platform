/**
 * Time to first byte for a club's main page types on staging (docs/operations/performance.md).
 *
 *   SPEED_BASE_URL=https://<staging address> \
 *   VERCEL_PROTECTION_BYPASS=<secret> \
 *   node scripts/measure-speed.ts [club-slug] [runs]
 *
 * Staging is behind Vercel's login. The bypass secret comes from Vercel → Project → Settings →
 * Deployment Protection → Protection Bypass for Automation. Keep it in your git-ignored .env;
 * never commit it.
 *
 * Each page is asked for once to warm up (not counted), then `runs` times (default 20), one at
 * a time. Time to first byte is from sending the request to the first byte of the page body.
 */

const base = process.env.SPEED_BASE_URL?.replace(/\/$/, '')
const bypass = process.env.VERCEL_PROTECTION_BYPASS
const club = process.argv[2] ?? 'heathcote-demo'
const runs = Number.parseInt(process.argv[3] ?? '20', 10)

if (!base) {
  console.error('Set SPEED_BASE_URL to the staging address (see the comment at the top).')
  process.exit(1)
}

const pages: [string, string][] = [
  ['Home page', ''],
  ['Content page', '/visitors'],
  ['News list', '/news'],
  ['Events', '/events'],
  ['Search', '/search?q=lessons'],
]

const headers: Record<string, string> = { 'user-agent': 'golf-platform speed check' }
if (bypass) headers['x-vercel-protection-bypass'] = bypass

/** Milliseconds to the first byte of the body. */
const timeToFirstByte = async (url: string) => {
  const start = performance.now()
  const res = await fetch(url, { headers, redirect: 'manual' })
  if (res.status !== 200) {
    await res.body?.cancel()
    throw new Error(`${url} answered ${res.status}. Check the address and the bypass secret.`)
  }
  const reader = res.body!.getReader()
  await reader.read()
  const ms = performance.now() - start
  await reader.cancel()
  return ms
}

const percentile = (sorted: number[], p: number) =>
  sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]

const rows: string[] = []
for (const [name, path] of pages) {
  const url = `${base}/preview/${club}${path}`
  await timeToFirstByte(url)
  const times: number[] = []
  for (let i = 0; i < runs; i++) times.push(await timeToFirstByte(url))
  times.sort((a, b) => a - b)
  const [p50, p95] = [percentile(times, 50), percentile(times, 95)].map(Math.round)
  rows.push(`| ${name} | \`${path || '/'}\` | ${p50} | ${p95} |`)
  console.info(`${name}: p50 ${p50} ms, p95 ${p95} ms`)
}

console.info(`\n${new Date().toISOString().slice(0, 10)}, ${runs} runs each, club ${club}:\n`)
console.info('| Page | Address | p50 TTFB (ms) | p95 TTFB (ms) |\n|---|---|---|---|')
console.info(rows.join('\n'))

export {}
