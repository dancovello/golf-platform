import { headers } from 'next/headers'

/**
 * A small script written into the page itself, carrying this page view's one-time code so the
 * content security policy lets it run (src/security/csp.ts, src/proxy.ts).
 */
export const InlineScript = async ({ code }: { code: string }) => {
  const nonce = (await headers()).get('x-nonce') ?? undefined
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: code }} />
}
