/** The Homepage Request Form's fields (Figma 265:8785): club name, current website, email. */
export type RequestValues = { clubName: string; website: string; email: string }

export type RequestErrors = Partial<Record<keyof RequestValues, string>>

export const EMPTY_REQUEST: RequestValues = { clubName: '', website: '', email: '' }

const text = (form: FormData, name: string) => {
  const value = form.get(name)
  return typeof value === 'string' ? value : ''
}

export const requestFromForm = (form: FormData): RequestValues => ({
  clubName: text(form, 'clubName').slice(0, 200),
  // Sent as "currentSite": "website" is the hidden spam trap, as on the club Contact form.
  website: text(form, 'currentSite').slice(0, 300),
  email: text(form, 'email').slice(0, 300),
})

/**
 * The website, loosely (hand-off §10: "accept without https://"). Returns the cleaned address,
 * e.g. "ashgroveparkgc.co.uk" → "https://ashgroveparkgc.co.uk", or null if it can't be one.
 */
export const cleanWebsite = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed || /\s/.test(trimmed)) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(withScheme)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    if (url.username || url.password) return null
    // A real domain: at least one dot and a top-level part of two or more letters.
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname)) return null
    return url.href.replace(/\/$/, '')
  } catch {
    return null
  }
}

const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i

export const validateRequest = (v: RequestValues): RequestErrors => {
  const errors: RequestErrors = {}
  const club = v.clubName.trim()
  if (!club) errors.clubName = 'Enter your club’s name.'
  else if (club.length > 120) errors.clubName = 'Keep the club name under 120 characters.'
  if (!v.website.trim()) errors.website = 'Enter your club’s current website.'
  else if (!cleanWebsite(v.website))
    errors.website = 'Enter a website address, like yourclub.co.uk.'
  const email = v.email.trim()
  if (!email) errors.email = 'Enter your email address.'
  else if (email.length > 254 || !EMAIL.test(email))
    errors.email = 'Enter an email address, like you@yourclub.co.uk.'
  return errors
}
