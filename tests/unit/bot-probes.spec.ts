import { describe, expect, it } from 'vitest'

import { isBotProbe } from '@/security/botProbes'

describe('bot probe addresses (Sentry GOLF-PLATFORM-D)', () => {
  it.each([
    '/xmlrpc.php',
    '/wp-login.php',
    '/wp-admin',
    '/wp-admin/setup-config.php',
    '/wp-content/plugins/x/readme.txt',
    '/wp-includes/wlwmanifest.xml',
    '/wp-json/wp/v2/users',
    '/wordpress/',
    '/index.php',
    '/index.php/about',
    '/old/news.PHP',
    '/info.php7',
    '/.env',
    '/.env.production',
    '/.git/config',
    '/.aws/credentials',
  ])('turns away %s', (path) => {
    expect(isBotProbe(path)).toBe(true)
  })

  it.each([
    '/',
    '/how-it-works',
    '/accessibility',
    '/news/wp-launch-day',
    '/news/php-and-friends',
    '/admin',
    '/api/pages',
    '/health',
    '/.well-known/security.txt',
    '/robots.txt',
    '/environment',
  ])('lets real pages through: %s', (path) => {
    expect(isBotProbe(path)).toBe(false)
  })
})

describe('the proxy turns bot probes away before any page runs', () => {
  it('answers /xmlrpc.php with a plain 404 on any address', async () => {
    const { NextRequest } = await import('next/server')
    const { proxy } = await import('@/proxy')
    for (const host of ['a1engine.co', 'www.someclub.co.uk', 'localhost:3000']) {
      const response = proxy(new NextRequest(`https://${host}/xmlrpc.php`, { headers: { host } }))
      expect(response.status).toBe(404)
      expect(response.headers.get('x-middleware-rewrite')).toBeNull()
    }
  })
})
