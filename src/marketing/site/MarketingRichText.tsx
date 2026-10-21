import { Fragment, type ReactNode } from 'react'

import { isSafeURL } from '@/fields/link'

import { HOME_SLUG } from '../collections/MarketingPages'

type Node = {
  type?: string
  tag?: string
  listType?: string
  text?: string
  format?: number
  children?: Node[]
  fields?: {
    url?: string
    linkType?: string
    newTab?: boolean
    doc?: { value?: unknown } | null
  } | null
}

const BOLD = 1
const ITALIC = 2

/** Where a link goes: another marketing page, or a checked web address. Anything else: none. */
const hrefOf = (fields: Node['fields']): string | null => {
  if (!fields) return null
  if (fields.linkType === 'internal') {
    const slug = (fields.doc?.value as { slug?: unknown } | undefined)?.slug
    if (typeof slug !== 'string') return null
    return slug === HOME_SLUG ? '/' : `/${slug}`
  }
  return isSafeURL(fields.url) ? (fields.url as string) : null
}

const draw = (nodes: Node[] | undefined): ReactNode =>
  (nodes ?? []).map((node, i) => <Fragment key={i}>{drawNode(node)}</Fragment>)

const drawNode = (node: Node): ReactNode => {
  switch (node.type) {
    case 'text': {
      let out: ReactNode = node.text ?? ''
      if ((node.format ?? 0) & ITALIC) out = <em>{out}</em>
      if ((node.format ?? 0) & BOLD) out = <strong>{out}</strong>
      return out
    }
    case 'linebreak':
      return <br />
    case 'paragraph':
      return <p>{draw(node.children)}</p>
    case 'heading':
      return node.tag === 'h3' ? <h3>{draw(node.children)}</h3> : <h2>{draw(node.children)}</h2>
    case 'quote':
      return <blockquote>{draw(node.children)}</blockquote>
    case 'list':
      return node.listType === 'number' ? (
        <ol>{draw(node.children)}</ol>
      ) : (
        <ul>{draw(node.children)}</ul>
      )
    case 'listitem':
      return <li>{draw(node.children)}</li>
    case 'link':
    case 'autolink': {
      const href = hrefOf(node.fields)
      if (!href) return draw(node.children)
      const external = !href.startsWith('/')
      return (
        <a
          href={href}
          {...(external && node.fields?.newTab
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {draw(node.children)}
        </a>
      )
    }
    default:
      // Not an allowed element: skipped.
      return null
  }
}

/** Draws marketing rich text (src/marketing/richText.ts). Text is escaped by React, never HTML. */
export const MarketingRichText = ({ value }: { value: unknown }) => (
  <>{draw((value as { root?: Node } | null)?.root?.children)}</>
)
