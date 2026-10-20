import { describe, expect, it } from 'vitest'

import { hostProblem, isPlatformHost, normaliseHost } from '@/site/hosts'

describe('club web addresses (build step 4)', () => {
  it('tidies what people type into a bare address', () => {
    expect(normaliseHost(' HTTPS://WWW.Club.co.uk/about?x=1 ')).toBe('www.club.co.uk')
    expect(normaliseHost('club.co.uk.')).toBe('club.co.uk')
    expect(normaliseHost('club-a.localhost:3100')).toBe('club-a.localhost')
  })

  it("knows the platform's own addresses", () => {
    expect(isPlatformHost('localhost', undefined)).toBe(true)
    expect(isPlatformHost('127.0.0.1', undefined)).toBe(true)
    expect(isPlatformHost('golf-platform-git-x.vercel.app', undefined)).toBe(true)
    expect(isPlatformHost('admin.example.com', 'https://admin.example.com')).toBe(true)
    expect(isPlatformHost('www.club.co.uk', 'https://admin.example.com')).toBe(false)
    expect(isPlatformHost('club-a.localhost', undefined)).toBe(false)
  })

  it('refuses addresses a club can never have', () => {
    expect(hostProblem('www.club.co.uk')).toBeNull()
    expect(hostProblem('club-a.localhost')).toBeNull()
    for (const bad of ['localhost', 'club', 'my club.co.uk', '-club.co.uk', 'club_a.co.uk']) {
      expect(hostProblem(bad), bad).not.toBeNull()
    }
    expect(hostProblem('golf-platform.vercel.app')).toContain('platform itself')
  })
})
