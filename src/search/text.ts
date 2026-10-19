import type { Block, Field } from 'payload'

/**
 * The words a visitor can read in a page's blocks, for the search index. It follows each block's
 * own field list, so it works for every block (including ones added later) without knowing what
 * they are: it keeps text, long text and rich text, and skips settings such as styles, colours
 * and web addresses.
 */

/** Text fields that hold addresses or codes rather than words a visitor reads. */
const SKIP_NAMES = new Set(['url', 'slug', 'href', 'embed', 'videoUrl', 'mapUrl', 'directions'])

/** Every piece of text in a rich text value (Lexical's JSON), in reading order. */
export const richTextWords = (value: unknown): string[] => {
  const out: string[] = []
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const n = node as { text?: unknown; children?: unknown; root?: unknown }
    if (typeof n.text === 'string') out.push(n.text)
    if (n.root) walk(n.root)
    if (Array.isArray(n.children)) {
      n.children.forEach(walk)
      // Paragraphs, headings and list items each end a sentence.
      out.push('\n')
    }
  }
  walk(value)
  return out
}

const fieldWords = (fields: Field[], data: unknown, out: string[], blocks: Block[]) => {
  if (!data || typeof data !== 'object') return
  const values = data as Record<string, unknown>
  for (const field of fields) {
    switch (field.type) {
      case 'text':
      case 'textarea': {
        const value = values[field.name]
        if (!SKIP_NAMES.has(field.name) && typeof value === 'string' && value.trim()) {
          out.push(value.trim(), '\n')
        }
        break
      }
      case 'richText':
        out.push(...richTextWords(values[field.name]))
        break
      case 'row':
      case 'collapsible':
        fieldWords(field.fields, data, out, blocks)
        break
      case 'group':
        if ('name' in field && field.name) fieldWords(field.fields, values[field.name], out, blocks)
        else fieldWords(field.fields, data, out, blocks)
        break
      case 'tabs':
        for (const tab of field.tabs) {
          if ('name' in tab && tab.name) fieldWords(tab.fields, values[tab.name], out, blocks)
          else fieldWords(tab.fields, data, out, blocks)
        }
        break
      case 'array': {
        const rows = values[field.name]
        if (Array.isArray(rows)) rows.forEach((row) => fieldWords(field.fields, row, out, blocks))
        break
      }
      case 'blocks': {
        const rows = values[field.name]
        if (Array.isArray(rows)) out.push(...blockWords(field.blocks as Block[], rows))
        break
      }
      default:
        break
    }
  }
}

/** The words in a list of blocks (a page's layout), as one string per block. */
export const blockWords = (blocks: Block[], layout: unknown): string[] => {
  if (!Array.isArray(layout)) return []
  const out: string[] = []
  for (const row of layout) {
    const config = blocks.find((b) => b.slug === (row as { blockType?: unknown })?.blockType)
    if (config) fieldWords(config.fields, row, out, blocks)
  }
  return out
}

/** Joins pieces of text into tidy prose: one space between words, no empty lines. */
export const tidy = (pieces: string[]): string =>
  pieces
    .join(' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim()

/** The opening of some text, cut at a word and at most `max` characters long. */
export const opening = (text: string, max = 160): string => {
  const flat = text.replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  const cut = flat.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, '')}…`
}
