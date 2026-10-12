import { Fragment, type ReactNode } from 'react'

import { isSafeURL } from '@/fields/link'

import { isExternal, siteHref } from '../components/links'
import { isImage, Photo } from './parts'
import type { BlockContext } from './resolve'

type Node = {
  type?: string
  tag?: string
  listType?: string
  text?: string
  format?: number
  children?: Node[]
  value?: unknown
  url?: string
  fields?: {
    url?: string
    linkType?: string
    newTab?: boolean
    doc?: { value?: unknown } | null
    caption?: string | null
  } | null
}

export type Heading = { id: string; text: string; level: 2 | 3 }

const BOLD = 1
const ITALIC = 2

const textOf = (node: Node): string =>
  node.type === 'text' ? (node.text ?? '') : (node.children ?? []).map(textOf).join('')

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'section'

/** The H2/H3 headings with the anchor ids they get when drawn (for "On this page"). */
export const headingsOf = (value: unknown): Heading[] => {
  const seen = new Map<string, number>()
  return ((value as { root?: Node } | null)?.root?.children ?? [])
    .filter((n) => n.type === 'heading' && (n.tag === 'h2' || n.tag === 'h3'))
    .map((n) => {
      const text = textOf(n)
      const base = slug(text)
      const count = seen.get(base) ?? 0
      seen.set(base, count + 1)
      return { id: count ? `${base}-${count + 1}` : base, text, level: n.tag === 'h2' ? 2 : 3 }
    })
}

/**
 * Draws club rich text (src/blocks/richText/lexical.ts). Only the allowed elements are drawn;
 * anything else is skipped. Links go to the club's own pages or a checked web address; photos
 * are looked up within the club. Text is always escaped by React, never inserted as HTML.
 */
export const RichTextContent = ({
  value,
  ctx,
  base,
  leadClass,
  dropCapClass,
  afterSecondParagraph,
}: {
  value: unknown
  ctx: BlockContext
  base: string
  /** Style C: the first paragraph is the lead, the next starts with a drop cap. */
  leadClass?: string
  dropCapClass?: string
  /** Style C: the side note goes after the drop-cap paragraph, beside the text that follows. */
  afterSecondParagraph?: ReactNode
}) => {
  const headings = headingsOf(value)
  let headingIndex = 0
  let paragraphIndex = 0

  const inline = (nodes: Node[] | undefined): ReactNode[] =>
    (nodes ?? []).map((n, i) => {
      if (n.type === 'text') {
        let el: ReactNode = n.text ?? ''
        if ((n.format ?? 0) & ITALIC) el = <em>{el}</em>
        if ((n.format ?? 0) & BOLD) el = <strong>{el}</strong>
        return <span key={i}>{el}</span>
      }
      if (n.type === 'linebreak') return <br key={i} />
      if (n.type === 'link' || n.type === 'autolink') {
        const label = textOf(n) || 'link'
        if (n.fields?.linkType === 'internal') {
          const resolved = ctx.link({ label, type: 'page', page: n.fields.doc?.value })
          return resolved ? (
            <a key={i} href={siteHref(base, resolved.link)}>
              {inline(n.children)}
            </a>
          ) : (
            <span key={i}>{inline(n.children)}</span>
          )
        }
        const url = n.fields?.url ?? n.url
        if (!isSafeURL(url)) return <span key={i}>{inline(n.children)}</span>
        const href = url.trim()
        return (
          <a
            key={i}
            href={href}
            {...(isExternal({ kind: 'url', href }) ? { rel: 'noopener' } : {})}
          >
            {inline(n.children)}
          </a>
        )
      }
      return null
    })

  const block = (n: Node, i: number): ReactNode => {
    switch (n.type) {
      case 'paragraph': {
        const index = paragraphIndex++
        if (!textOf(n).trim()) return null
        const className =
          index === 0 && leadClass
            ? leadClass
            : index === 1 && dropCapClass
              ? dropCapClass
              : undefined
        const p = (
          <p key={i} className={className}>
            {inline(n.children)}
          </p>
        )
        return index === 1 && afterSecondParagraph
          ? [p, <Fragment key={`${i}-after`}>{afterSecondParagraph}</Fragment>]
          : p
      }
      case 'heading': {
        if (n.tag !== 'h2' && n.tag !== 'h3') return null
        const h = headings[headingIndex++]
        return n.tag === 'h2' ? (
          <h2 key={i} id={h?.id} className="t-heading-l">
            {inline(n.children)}
          </h2>
        ) : (
          <h3 key={i} id={h?.id} className="t-heading-m">
            {inline(n.children)}
          </h3>
        )
      }
      case 'list': {
        const items = (n.children ?? []).map((li, k) => <li key={k}>{inline(li.children)}</li>)
        return n.listType === 'number' ? <ol key={i}>{items}</ol> : <ul key={i}>{items}</ul>
      }
      case 'quote':
        return (
          <blockquote key={i} className="t-quote-m">
            {inline(n.children)}
          </blockquote>
        )
      case 'upload': {
        const image = ctx.media(n.value)
        if (!isImage(image)) return null
        return (
          <figure key={i}>
            <Photo image={image} sizes="(max-width: 767px) 100vw, 760px" />
            {n.fields?.caption ? (
              <figcaption className="t-caption">{n.fields.caption}</figcaption>
            ) : null}
          </figure>
        )
      }
      default:
        return null
    }
  }

  return <>{((value as { root?: Node } | null)?.root?.children ?? []).map(block)}</>
}
