import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

/**
 * Sent with every page and API response. The live preview frames the club's page inside the
 * admin, on the same address, so framing by the site itself stays allowed; nothing else may
 * frame it (that would let another site trick someone into clicking inside the admin).
 * This is the basic policy for every response. Pages get the full content security policy
 * (which scripts may run, with a fresh code per page view) from src/proxy.ts and
 * src/security/csp.ts.
 */
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
  },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Always use https for the next two years. No includeSubDomains: a club's own domain may
  // have other sites under it that aren't ours.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
]

const nextConfig: NextConfig = {
  // Don't announce which framework runs the site.
  poweredByHeader: false,
  headers: async () => [{ source: '/:path*', headers: securityHeaders }],
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
