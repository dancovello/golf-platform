import { afterEach, describe, expect, it, vi } from 'vitest'

// Audit 2026-10-22 (docs/security/audit-csp-headers.md, finding 4). The report address
// (/csp-report) takes text from anyone on the internet and writes it to the server log.
// Fixed 23 Oct 2026: values are cleaned of control characters and capped, and only known
// directive names are logged.

vi.mock('@/security/limitRequest', () => ({ withinLimit: vi.fn(async () => true) }))
vi.mock('@/monitoring/sentry', () => ({ sentryEnabled: () => false }))
vi.mock('@sentry/nextjs', () => ({ captureMessage: vi.fn() }))

const send = async (report: Record<string, unknown>) => {
  const { POST } = await import('@/app/(frontend)/csp-report/route')
  const lines: string[] = []
  const spy = vi.spyOn(console, 'warn').mockImplementation((line: unknown) => {
    lines.push(String(line))
  })
  const response = await POST(
    new Request('http://localhost/csp-report', {
      method: 'POST',
      body: JSON.stringify({ 'csp-report': report }),
    }),
  )
  spy.mockRestore()
  return { response, lines }
}

afterEach(() => vi.clearAllMocks())

describe('the policy report address (audit finding 4)', () => {
  it('a sender cannot add fake lines to the server log', async () => {
    const { response, lines } = await send({
      'document-uri': 'https://club-a.example/',
      'effective-directive':
        'script-src\nSecurity policy blocked https://evil.example (script-src) on /admin',
      'blocked-uri': 'inline',
    })
    expect(response.status).toBe(204)
    expect(lines).toHaveLength(1)
    // Today the sender's line break goes straight into the log, so one report reads as two.
    expect(lines[0]).not.toContain('\n')
  })

  it('what a sender writes is kept short', async () => {
    const { lines } = await send({
      'document-uri': 'https://club-a.example/',
      'effective-directive': 'x'.repeat(5000),
      'blocked-uri': 'inline',
    })
    // Today the directive is copied whole (up to the 10,000-character body limit).
    expect(lines[0].length).toBeLessThan(300)
  })

  it('logs a directive it does not know as "unknown"', async () => {
    const { lines } = await send({
      'document-uri': 'https://club-a.example/',
      'effective-directive': 'made-up-directive',
      'blocked-uri': 'inline',
    })
    expect(lines[0]).toContain('(unknown)')
  })

  it('keeps the name of an older browser’s whole rule', async () => {
    const { lines } = await send({
      'document-uri': 'https://club-a.example/',
      'violated-directive': "script-src 'self' 'nonce-abc'",
      'blocked-uri': 'inline',
    })
    expect(lines[0]).toContain('(script-src)')
  })
})
