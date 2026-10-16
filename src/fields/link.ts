import type { Field, GroupField } from 'payload'

/**
 * Where a link may point: the club's own pages, or a web, email or phone address.
 * Anything else (e.g. "javascript:") is refused, because these end up as links on the
 * public site. Pages are checked to belong to the same club in src/site/sameClub.ts.
 */
const SAFE_URL = /^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[0-9 ()-]+|\/[^\s]*)$/i

export const isSafeURL = (value: unknown): value is string =>
  typeof value === 'string' && SAFE_URL.test(value.trim())

/** Pages every club's site has without being CMS pages (the templates), by their address. */
export const BUILT_IN_PAGES = [
  { label: 'News', value: 'news' },
  { label: 'Events', value: 'events' },
  { label: 'Contact', value: 'contact' },
  { label: 'Privacy policy', value: 'privacy' },
] as const

/** A built-in page as a website link (slug = its address under the club), or null. */
export const builtInLink = (value: unknown): { kind: 'page'; slug: string } | null =>
  BUILT_IN_PAGES.some((p) => p.value === value) ? { kind: 'page', slug: value as string } : null

/** Whether a stored link goes to one of the club's CMS pages (rather than a web address or a
 * built-in page). The default type is "page". */
export const linksToPage = (type: unknown) => type !== 'url' && type !== 'builtIn'

type LinkOptions = { name: string; label: string; withLabel?: boolean; required?: boolean }

export const linkField = ({
  name,
  label,
  withLabel = true,
  required = true,
}: LinkOptions): GroupField => ({
  name,
  label,
  type: 'group',
  fields: [
    {
      type: 'row',
      fields: [
        ...(withLabel
          ? ([{ name: 'label', label: 'Text', type: 'text', required, maxLength: 40 }] as Field[])
          : []),
        {
          name: 'type',
          label: 'Goes to',
          type: 'radio',
          defaultValue: 'page',
          options: [
            { label: 'One of our pages', value: 'page' },
            { label: 'News, Events or Contact', value: 'builtIn' },
            { label: 'A web address', value: 'url' },
          ],
        },
      ],
    },
    {
      name: 'page',
      label: 'Page',
      type: 'relationship',
      relationTo: 'pages',
      admin: { condition: (_data, sibling) => linksToPage(sibling?.type) },
      validate: (value: unknown, { siblingData }: { siblingData: { type?: string } }) =>
        !required || !linksToPage(siblingData?.type) || value ? true : 'Choose a page.',
    },
    {
      name: 'builtIn',
      label: 'Built-in page',
      type: 'select',
      options: [...BUILT_IN_PAGES],
      admin: { condition: (_data, sibling) => sibling?.type === 'builtIn' },
      validate: (value: unknown, { siblingData }: { siblingData: { type?: string } }) =>
        siblingData?.type !== 'builtIn' || builtInLink(value) ? true : 'Choose a page.',
    },
    {
      name: 'url',
      label: 'Web address',
      type: 'text',
      admin: {
        condition: (_data, sibling) => sibling?.type === 'url',
        description:
          'e.g. https://booking.example.com, mailto:office@club.co.uk or tel:01234 567890',
      },
      validate: (value: unknown, { siblingData }: { siblingData: { type?: string } }) => {
        if (siblingData?.type !== 'url') return true
        if (!value) return required ? 'Enter a web address.' : true
        return isSafeURL(value)
          ? true
          : 'Use a full web address starting with https://, or mailto: / tel:.'
      },
    },
  ],
})
