/** Builds Lexical rich-text values for tests and seeds. */
type Node = Record<string, unknown>

const text = (t: string, format = 0): Node => ({
  type: 'text',
  text: t,
  format,
  version: 1,
  detail: 0,
  mode: 'normal',
  style: '',
})
const el = (type: string, children: Node[], extra: Node = {}): Node => ({
  type,
  children,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
  ...extra,
})

export const rt = {
  p: (...parts: (string | Node)[]) =>
    el(
      'paragraph',
      parts.map((p) => (typeof p === 'string' ? text(p) : p)),
      { textFormat: 0 },
    ),
  h2: (t: string) => el('heading', [text(t)], { tag: 'h2' }),
  h3: (t: string) => el('heading', [text(t)], { tag: 'h3' }),
  bold: (t: string) => text(t, 1),
  ul: (...items: string[]) =>
    el(
      'list',
      items.map((t, i) => el('listitem', [text(t)], { value: i + 1 })),
      { listType: 'bullet', tag: 'ul', start: 1 },
    ),
  quote: (t: string) => el('quote', [text(t)]),
  pageLink: (t: string, pageID: string) =>
    el('link', [text(t)], {
      fields: { linkType: 'internal', newTab: false, doc: { relationTo: 'pages', value: pageID } },
    }),
  urlLink: (t: string, url: string) =>
    el('link', [text(t)], { fields: { linkType: 'custom', newTab: false, url } }),
  image: (mediaID: string, caption?: string) => ({
    type: 'upload',
    relationTo: 'media',
    value: mediaID,
    fields: caption ? { caption } : {},
    format: '',
    version: 3,
  }),
  doc: (...children: Node[]) => ({ root: el('root', children) }),
}
