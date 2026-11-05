/**
 * Turns a pasted YouTube or Vimeo address into the safe address we play it from.
 *
 * Only these two providers are accepted, and the embed address is built here from the video's
 * ID, never copied from what the editor pasted. So an editor can't point the player at any other
 * site. Used by the editor (to check the address) and by the website (to draw the player).
 *
 * Privacy: YouTube plays from its "no cookie" address, and Vimeo with do-not-track on. The
 * player only loads when a visitor presses play (src/site/blocks/VideoPlayer.tsx).
 */

export type VideoProvider = 'youtube' | 'vimeo'

export type ParsedVideo = {
  provider: VideoProvider
  id: string
  /** The page where the video lives, for the "Watch on …" link. */
  watchURL: string
  /** The address the player loads from. Autoplays, because the visitor has just pressed play. */
  embedURL: string
}

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
])
const YOUTUBE_NOCOOKIE_HOSTS = new Set(['youtube-nocookie.com', 'www.youtube-nocookie.com'])
const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'])

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/
const VIMEO_ID = /^\d{5,12}$/
// Vimeo's private-link code, as in vimeo.com/123456789/abcdef1234
const VIMEO_HASH = /^[a-f0-9]{6,20}$/i

/** "1h2m3s", "90s" or "90" in a YouTube link's `t` or `start`, as whole seconds. */
const startSeconds = (value: string | null): number => {
  if (!value) return 0
  if (/^\d+$/.test(value)) return Math.min(Number(value), 86_400)
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value)
  if (!m || !(m[1] || m[2] || m[3])) return 0
  return Math.min(Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0), 86_400)
}

const youtube = (id: string, start: number): ParsedVideo | null => {
  if (!YOUTUBE_ID.test(id)) return null
  const params = new URLSearchParams({ autoplay: '1', rel: '0', playsinline: '1' })
  if (start > 0) params.set('start', String(start))
  return {
    provider: 'youtube',
    id,
    watchURL: `https://www.youtube.com/watch?v=${id}${start > 0 ? `&t=${start}s` : ''}`,
    embedURL: `https://www.youtube-nocookie.com/embed/${id}?${params}`,
  }
}

const vimeo = (id: string, hash: string | null): ParsedVideo | null => {
  if (!VIMEO_ID.test(id)) return null
  const safeHash = hash && VIMEO_HASH.test(hash) ? hash : null
  const params = new URLSearchParams({ autoplay: '1', dnt: '1' })
  if (safeHash) params.set('h', safeHash)
  return {
    provider: 'vimeo',
    id,
    watchURL: `https://vimeo.com/${id}${safeHash ? `/${safeHash}` : ''}`,
    embedURL: `https://player.vimeo.com/video/${id}?${params}`,
  }
}

/** The video behind a pasted address, or null if it isn't a YouTube or Vimeo video link. */
export const parseVideoURL = (input: unknown): ParsedVideo | null => {
  if (typeof input !== 'string') return null
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  // No logins or ports in the address: nothing legitimate has them.
  if (url.username || url.password || url.port) return null
  const host = url.hostname.toLowerCase()
  const parts = url.pathname.split('/').filter(Boolean)

  if (host === 'youtu.be') {
    return youtube(parts[0] ?? '', startSeconds(url.searchParams.get('t')))
  }
  if (YOUTUBE_HOSTS.has(host)) {
    const start = startSeconds(url.searchParams.get('t') ?? url.searchParams.get('start'))
    if (parts[0] === 'watch') return youtube(url.searchParams.get('v') ?? '', start)
    if (['embed', 'shorts', 'live', 'v'].includes(parts[0] ?? ''))
      return youtube(parts[1] ?? '', start)
    return null
  }
  if (YOUTUBE_NOCOOKIE_HOSTS.has(host)) {
    return parts[0] === 'embed'
      ? youtube(parts[1] ?? '', startSeconds(url.searchParams.get('start')))
      : null
  }
  if (VIMEO_HOSTS.has(host)) {
    if (host === 'player.vimeo.com') {
      return parts[0] === 'video' ? vimeo(parts[1] ?? '', url.searchParams.get('h')) : null
    }
    // vimeo.com/123456789 or vimeo.com/123456789/abcdef1234 (an unlisted video)
    return vimeo(parts[0] ?? '', parts[1] ?? url.searchParams.get('h'))
  }
  return null
}

/** The editor's error message when an address isn't accepted, or `true`. */
export const validateVideoURL = (value: unknown): true | string =>
  parseVideoURL(value)
    ? true
    : 'Paste the address of a YouTube or Vimeo video, for example https://www.youtube.com/watch?v=… or https://vimeo.com/…'

export const PROVIDER_NAMES: Record<VideoProvider, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
}
