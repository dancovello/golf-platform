import type { Answer } from '@/search/answers'

import { ProtectedEmail } from '../blocks/ProtectedEmail'
import { ArrowRight } from '../components/Icons'

// No server-only imports: the header search panel (browser) uses this too.

/**
 * Figma "Search/Answer Card" (Fees, Status, Person): a short answer from the club's own
 * structured content, above the results. It always says where the facts came from.
 */
export const AnswerCard = ({ answer, compact = false }: { answer: Answer; compact?: boolean }) => {
  const first = answer.title.trim().split(/\s+/)[0]
  return (
    <section
      className={`sa-card is-${answer.kind}${compact ? ' is-compact' : ''}`}
      aria-label={`${answer.eyebrow}: ${answer.title}`}
    >
      <div className="sa-top">
        {answer.person ? (
          <span className="sa-avatar" aria-hidden="true">
            {answer.person.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- sized copies via srcset from R2
              <img
                src={answer.person.image.url}
                srcSet={answer.person.image.srcSet ?? undefined}
                sizes="56px"
                alt=""
                style={{ objectPosition: answer.person.image.position }}
              />
            ) : (
              <span className="t-data-serif">{answer.person.initials}</span>
            )}
          </span>
        ) : null}
        <div className="sa-title-block">
          <p className="t-eyebrow sa-eyebrow">
            {answer.tone ? (
              <span className={`sa-dot is-${answer.tone}`} aria-hidden="true" />
            ) : null}
            {answer.eyebrow}
          </p>
          <h2 className="sa-title">{answer.title}</h2>
          {answer.source ? <p className="t-label-s sa-source">{answer.source}</p> : null}
        </div>
      </div>
      {answer.note ? <p className="t-body-s sa-note">{answer.note}</p> : null}
      {answer.facts.length > 0 ? (
        <dl className="sa-facts">
          {answer.facts.map((f) => (
            <div key={`${f.label}:${f.value}`} className="sa-fact">
              <dt className="t-data-label">{f.label}</dt>
              <dd className="t-data-serif">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {answer.actions.length > 0 || answer.email ? (
        <div className="sa-actions">
          {answer.actions.map((a) => (
            <a
              key={a.label}
              className={`btn ${a.primary ? 'btn-solid' : 'btn-link'} t-label-button`}
              href={a.href}
              {...(a.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {a.label}
              <ArrowRight />
            </a>
          ))}
          {answer.email ? (
            <ProtectedEmail
              user={answer.email.user}
              domain={answer.email.domain}
              className="btn btn-link t-label-button"
            >
              Email {first}
              <ArrowRight />
            </ProtectedEmail>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
