// Shared rate limits (job 4, 21 Oct grilling; docs/operations/rate-limits.md). The search limit
// is counted in the database, so it holds however many servers are running.
import { expect, test } from './fixtures'

test('search suggestions answer 429 once a visitor passes the limit', async ({ request }) => {
  // A made-up address of its own, so this test never uses up other tests' allowance.
  const n = () => Math.floor(Math.random() * 250) + 1
  const visitor = `198.51.${n()}.${n()}`
  const ask = () =>
    request.get('/preview/test-club-a/search/suggest?q=membership', {
      headers: { 'x-forwarded-for': visitor },
    })
  // Limits count per clock minute: start early in one, so all requests land in the same minute.
  test.setTimeout(90_000)
  const second = new Date().getSeconds()
  if (second > 40) await new Promise((r) => setTimeout(r, (61 - second) * 1000))
  const statuses: number[] = []
  for (let i = 0; i < 125; i++) statuses.push((await ask()).status())
  expect(statuses.slice(0, 120).every((s) => s === 200)).toBe(true)
  expect(statuses.slice(120)).toEqual([429, 429, 429, 429, 429])

  // Another visitor is unaffected.
  const other = await request.get('/preview/test-club-a/search/suggest?q=membership', {
    headers: { 'x-forwarded-for': `203.0.113.${n()}` },
  })
  expect(other.status()).toBe(200)
})
