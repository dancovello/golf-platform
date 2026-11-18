/**
 * Addresses only hacking bots ask for: WordPress's admin and files, any PHP script, and stray
 * settings or version-control files. The platform never serves any of them on any address (the
 * marketing site, a club's domain or the platform's own), so the proxy answers "not found"
 * straight away. Without this, each probe ran a page, woke the database from sleep and could
 * raise a Sentry error (GOLF-PLATFORM-D, 18 Nov 2026: /xmlrpc.php).
 */
const PROBES = [
  // WordPress: its admin, login, files and API.
  /^\/(wp-admin|wp-includes|wp-content|wp-json|wp-login|wordpress)(\/|\.|$)/i,
  // Any PHP script, e.g. /xmlrpc.php or /index.php/anything.
  /\.php\d?(\/|$)/i,
  // Hidden settings and version-control files, e.g. /.env or /.git/config.
  /^\/\.(env|git|svn|hg|aws|ssh|htaccess|htpasswd|DS_Store)(\/|\.|$)/i,
]

export const isBotProbe = (pathname: string) => PROBES.some((probe) => probe.test(pathname))
