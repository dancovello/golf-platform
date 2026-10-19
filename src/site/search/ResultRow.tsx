import type { SearchResult } from '@/search/query'

import { Photo } from '../blocks/parts'
import { ProtectedEmail } from '../blocks/ProtectedEmail'
import { initials } from '../blocks/teamShared'
import { ArrowRight, ArrowUpRight, Download, FileIcon } from '../components/Icons'
import { NEW_TAB, linkTarget, siteHref } from '../components/links'
import { Highlight } from './Highlight'
import { KINDS, resultMeta } from './kinds'

const UK = 'Europe/London'

/** Figma "Search/Result Row": the lead picture for each kind. */
const Lead = ({ result }: { result: SearchResult }) => {
  const { kind, details, title, date } = result
  if (kind === 'event' && date) {
    const d = new Date(date)
    return (
      <span className="srch-lead srch-date" aria-hidden="true">
        <span className="t-data-serif">
          {d.toLocaleDateString('en-GB', { day: 'numeric', timeZone: UK })}
        </span>
        <span className="t-data-label">
          {d.toLocaleDateString('en-GB', { month: 'short', timeZone: UK })}
        </span>
      </span>
    )
  }
  if ((kind === 'news' || kind === 'course' || kind === 'event') && details.image) {
    return (
      <span className="srch-lead srch-thumb">
        <Photo image={details.image} sizes="88px" alt="" />
      </span>
    )
  }
  if (kind === 'person') {
    return (
      <span className="srch-lead srch-avatar" aria-hidden="true">
        {details.image ? (
          <Photo image={details.image} sizes="64px" alt="" />
        ) : (
          <span className="t-data-serif">{initials(title)}</span>
        )}
      </span>
    )
  }
  if (kind === 'document') {
    return (
      <span className="srch-lead srch-tile" aria-hidden="true">
        <FileIcon size={20} />
        {details.fileType ? <span className="t-data-label">{details.fileType}</span> : null}
      </span>
    )
  }
  return (
    <span className="srch-lead srch-tile" aria-hidden="true">
      <ArrowUpRight size={20} />
    </span>
  )
}

/**
 * One result, any kind (Figma "Search/Result Row"). The whole row is the link (the title's link
 * stretches over it); the action on the right is a shortcut: Book for an event, Email for a
 * person, Download for a document. Phones hide the shortcut (spec §6).
 */
export const ResultRow = ({
  result,
  words,
  base,
  headingLevel = 3,
}: {
  result: SearchResult
  words: string[]
  base: string
  headingLevel?: 2 | 3
}) => {
  const { kind, details, link } = result
  const href = siteHref(base, link)
  const opensFile = kind === 'document'
  const meta = resultMeta(result)
  const Heading = `h${headingLevel}` as const
  const actionLabel =
    details.action?.label ?? (kind === 'person' && details.email ? 'Email' : KINDS[kind].action)

  let action = (
    <span className="srch-action t-label-button" aria-hidden="true">
      {actionLabel}
      {opensFile ? <Download size={14} /> : <ArrowRight size={14} />}
    </span>
  )
  if (kind === 'event' && details.action) {
    action = (
      <a
        className="srch-action t-label-button"
        href={siteHref(base, details.action.link)}
        {...linkTarget(details.action.link)}
      >
        {details.action.label}
        <span className="srch-visually-hidden">: {result.title}</span>
        <ArrowRight size={14} />
      </a>
    )
  } else if (kind === 'person' && details.email) {
    action = (
      <ProtectedEmail
        user={details.email.user}
        domain={details.email.domain}
        className="srch-action t-label-button"
      >
        Email
        <span className="srch-visually-hidden"> {result.title}</span>
        <ArrowRight size={14} />
      </ProtectedEmail>
    )
  }

  return (
    <article className={`srch-row is-${kind}`}>
      <Lead result={result} />
      <div className="srch-text">
        <p className="srch-kicker">
          <span className="t-data-label srch-kind">{KINDS[kind].singular}</span>
          {meta ? <span className="t-label-s">{meta}</span> : null}
        </p>
        <Heading className="t-heading-m srch-title">
          <a className="srch-link" href={href} {...(opensFile ? NEW_TAB : linkTarget(link))}>
            <Highlight text={result.title} words={words} />
          </a>
        </Heading>
        {result.excerpt ? (
          <p className="t-body-s srch-snippet">
            <Highlight text={result.excerpt} words={words} />
          </p>
        ) : null}
      </div>
      {action}
    </article>
  )
}
