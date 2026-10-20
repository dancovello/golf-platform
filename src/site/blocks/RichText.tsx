import type { RichTextBlock } from '@/payload-types'

import { OnThisPage } from './OnThisPage'
import type { BlockContext } from './resolve'
import { headingsOf, RichTextContent } from './RichTextContent'

/**
 * Rich Text (docs/design/11), three styles: A Article (680px column), B With contents (sticky
 * "On this page" from the H2/H3s, shown once there are 3+ H2s), C Editorial (lead paragraph,
 * drop cap and an optional side note, on the subtle surface).
 */
export const RichText = ({
  block,
  ctx,
  base,
}: {
  block: RichTextBlock
  ctx: BlockContext
  base: string
}) => {
  const style = block.style ?? 'article'
  const headings = headingsOf(block.content)
  const showContents = style === 'contents' && headings.filter((h) => h.level === 2).length >= 3

  if (style === 'editorial') {
    const note =
      block.noteTitle || block.noteText ? (
        <aside className="rt-note">
          {block.noteTitle ? <p className="t-eyebrow rt-note-title">{block.noteTitle}</p> : null}
          {block.noteText ? <p className="t-body-s">{block.noteText}</p> : null}
        </aside>
      ) : null
    return (
      <section className="blk rt rt-editorial on-subtle">
        <div className="rt-column">
          {block.eyebrow ? <p className="t-eyebrow blk-eyebrow">{block.eyebrow}</p> : null}
          <div className="rt-prose">
            <RichTextContent
              value={block.content}
              ctx={ctx}
              base={base}
              leadClass="t-heading-m rt-lead"
              dropCapClass="rt-dropcap"
              afterSecondParagraph={note}
            />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`blk rt rt-${style}${showContents ? ' has-toc' : ''}`}>
      <div className="blk-container rt-layout">
        {showContents ? <OnThisPage headings={headings} /> : null}
        <div className="rt-prose">
          <RichTextContent value={block.content} ctx={ctx} base={base} />
        </div>
      </div>
    </section>
  )
}
