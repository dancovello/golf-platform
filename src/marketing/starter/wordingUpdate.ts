/**
 * Brings marketing pages that are already saved in a database up to the wording of 28 Oct 2026
 * (docs/plans/staging-wording-update.md). The starter copy (./pages.ts) only fills in a page when
 * it is first added, so saved pages keep their old text until this runs.
 *
 * It replaces a piece of text only when it is exactly the old starter text, so anything someone
 * reworded is left alone and reported instead. Pure functions, so tests/unit/marketing-wording-
 * update.spec.ts can prove them; scripts/update-marketing-wording.ts does the database part.
 */

/** Old starter text → new starter text. One line per string changed in PRs #206 and #210. */
export const REPLACEMENTS: readonly (readonly [string, string])[] = [
  [
    'Golf club websites your team can update in minutes. See a demo club, then book a demo or get your homepage rebuilt free.',
    'Golf club websites your team can update in minutes. See a demo club, then book a demo.',
  ],
  ['Get your free homepage', 'See how switching works'],
  [
    '{price} a month · No setup fee · Your homepage rebuilt free in two working days',
    '{price} a month · One-off setup fee agreed with your club · Your demo includes your club’s own homepage',
  ],
  [
    'We’ll rebuild your homepage in your colours and send it straight to you, free.',
    'Your demo includes your own club’s homepage, rebuilt on the platform.',
  ],
  [
    'One price per club, with hosting, every live block and unlimited editors included. No setup fee.',
    'One price per club, with hosting, every live block and unlimited editors included, plus a one-off setup fee agreed with your club.',
  ],
  [
    '{price} a month {vat} for your website, on a {term}-month term. No setup fee, and no charge per editor.',
    '{price} a month {vat} for your website, on a {term}-month term, plus a one-off setup fee agreed with your club. No charge per editor.',
  ],
  [
    'Prices exclude VAT. No setup fee. {notice} days’ notice after the first {term} months.',
    'Prices exclude VAT. Plus a one-off setup fee. {notice} days’ notice after the first {term} months.',
  ],
  [
    'Your public pages, news posts, PDFs and photos. We agree the exact list with you in week 1, before any work starts.',
    'Your public pages, news posts, PDFs and photos. We agree the exact list with you before any work starts.',
  ],
  [
    'Send us your club’s website and we’ll rebuild your homepage on our platform, free, within two working days. Then four weeks from first call to live site.',
    'We set your club up on our platform for a one-off fee, agreed with you, and support you until your site is live.',
  ],
  ['Free homepage', 'See it on your club'],
  [
    'Tell us your club and your current website. We’ll rebuild your homepage on our platform and send it straight to you, free.',
    'Tell us your club and your current website. In your demo, we’ll show you your own homepage on our platform.',
  ],
  ['In your inbox within two working days', 'Shown to you in your demo'],
  ['No call needed, and no commitment', 'No commitment until you decide to sign up'],
  ['Rebuild my homepage', 'Book my demo'],
  ['On its way.', 'Thanks.'],
  [
    'Four weeks, start to finish. We do the heavy lifting, and your committee signs off before anything goes live.',
    'We set you up for a one-off fee, agreed with your club, and support you until the site is live. Your committee signs off before anything goes live.',
  ],
  [
    'Start with a free homepage, or talk it through with us first.',
    'See your own club on the platform, or talk it through with us first.',
  ],
]

/** The "Week 1 to 4" plan block, taken off the Switching page. */
export const REMOVED_BLOCK = 'mkMigration'
const REMOVED_ON = 'switching'

/** Wording the 21 Oct evening decision removed. Anything still matching after an update is listed. */
export const RETIRED_PHRASES: readonly RegExp[] = [
  /free homepage/i,
  /rebuilt free/i,
  /rebuild your homepage[^.]*\bfree\b/i,
  /no setup fee/i,
  /four weeks/i,
  /send it straight to you/i,
  /\bweek [1-4]\b/i,
  /promised by/i,
  /on its way/i,
]

export type Change = { path: string; from: string; to: string }
export type Leftover = { path: string; text: string }

const replacements = new Map(REPLACEMENTS)

/** Replaces exact-match strings anywhere in `value`, returning the new value and what changed. */
export const replaceWording = (
  value: unknown,
  path = '',
): { value: unknown; changes: Change[] } => {
  if (typeof value === 'string') {
    const to = replacements.get(value)
    return to === undefined
      ? { value, changes: [] }
      : { value: to, changes: [{ path, from: value, to }] }
  }
  if (Array.isArray(value)) {
    const changes: Change[] = []
    const next = value.map((item, i) => {
      const result = replaceWording(item, `${path}[${i}]`)
      changes.push(...result.changes)
      return result.value
    })
    return { value: next, changes }
  }
  if (value && typeof value === 'object') {
    const changes: Change[] = []
    const next: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      const result = replaceWording(item, path ? `${path}.${key}` : key)
      changes.push(...result.changes)
      next[key] = result.value
    }
    return { value: next, changes }
  }
  return { value, changes: [] }
}

/** Text that still matches a retired phrase (reworded by hand, so not replaced). */
export const findLeftovers = (value: unknown, path = ''): Leftover[] => {
  if (typeof value === 'string') {
    return RETIRED_PHRASES.some((pattern) => pattern.test(value)) ? [{ path, text: value }] : []
  }
  if (Array.isArray(value)) return value.flatMap((item, i) => findLeftovers(item, `${path}[${i}]`))
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      findLeftovers(item, path ? `${path}.${key}` : key),
    )
  }
  return []
}

type PageFields = { slug: string; layout: unknown[]; metaDescription?: string }

/** What an update would do to one saved page. Nothing is written here. */
export const planPageUpdate = ({ slug, layout, metaDescription }: PageFields) => {
  const changes: Change[] = []
  let blocks = layout
  if (slug === REMOVED_ON) {
    blocks = layout.filter((block, i) => {
      const gone = (block as { blockType?: string })?.blockType === REMOVED_BLOCK
      if (gone) {
        changes.push({
          path: `layout[${i}]`,
          from: 'The Week 1 to 4 plan block',
          to: '(removed)',
        })
      }
      return !gone
    })
  }
  const text = replaceWording(blocks, 'layout')
  changes.push(...text.changes)
  const description =
    metaDescription === undefined ? undefined : replaceWording(metaDescription, 'meta.description')
  if (description) changes.push(...description.changes)
  const layoutAfter = text.value as unknown[]
  return {
    changes,
    layout: layoutAfter,
    metaDescription: description?.value as string | undefined,
    leftovers: [
      ...findLeftovers(layoutAfter, 'layout'),
      ...(metaDescription === undefined
        ? []
        : findLeftovers(description?.value, 'meta.description')),
    ],
  }
}
