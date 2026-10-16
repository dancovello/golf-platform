import type { ServerProps } from 'payload'

import { editorTenantID } from '../access/roles'
import { agreementParty } from '../agreement/acceptance'
import {
  AGREEMENT_APPROVED,
  AGREEMENT_VERSION,
  type AgreementBlock,
  agreementText,
} from '../agreement/text'

const Block = ({ block }: { block: AgreementBlock }) => {
  switch (block.kind) {
    case 'p':
      return <p>{block.text}</p>
    case 'clause':
      return (
        <p>
          <strong>{block.number}</strong> {block.text}
        </p>
      )
    case 'list':
      return (
        <ul>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    case 'table':
      return (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <caption style={{ textAlign: 'left', fontWeight: 600 }}>{block.caption}</caption>
            <thead>
              <tr>
                {block.head.map((h, i) => (
                  <th key={i} scope="col" style={cell}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((value, i) =>
                    i === 0 ? (
                      <th key={i} scope="row" style={cell}>
                        {value}
                      </th>
                    ) : (
                      <td key={i} style={cell}>
                        {value}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

const cell = {
  textAlign: 'left' as const,
  verticalAlign: 'top' as const,
  padding: '0.5rem 0.75rem 0.5rem 0',
  borderBottom: '1px solid var(--theme-elevation-150)',
}

/**
 * The agreement itself, above the accept form, with the club's own name and address. Only on
 * a new acceptance: a saved record shows the version it accepted instead.
 */
export const AgreementText = async ({ payload, user, id }: ServerProps) => {
  if (id) return null
  const tenantID = editorTenantID(user)
  const party = tenantID
    ? await agreementParty(payload, tenantID)
    : { clubName: 'the Club', legalName: '[Club legal name]', address: null }
  const sections = agreementText(party)
  return (
    <section aria-labelledby="dpa-title" style={{ marginBottom: '2rem', maxWidth: '52rem' }}>
      <h2 id="dpa-title">Data processing agreement</h2>
      <p style={{ color: 'var(--theme-elevation-600)' }}>Version {AGREEMENT_VERSION}</p>
      {AGREEMENT_APPROVED ? null : (
        <p
          role="note"
          style={{
            padding: '0.75rem 1rem',
            border: '1px solid var(--theme-warning-500)',
            background: 'var(--theme-warning-100)',
            borderRadius: 4,
          }}
        >
          Draft wording, awaiting legal review.
        </p>
      )}
      <div
        role="region"
        tabIndex={0}
        aria-label="Agreement text"
        style={{
          maxHeight: '28rem',
          overflowY: 'auto',
          padding: '1rem 1.25rem',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 4,
        }}
      >
        {sections.map((s, i) => (
          <section key={s.id} aria-labelledby={`dpa-${s.id}`}>
            <h3 id={`dpa-${s.id}`}>
              {s.id.startsWith('schedule') ? s.title : `${i + 1}. ${s.title}`}
            </h3>
            {s.blocks.map((b, k) => (
              <Block key={k} block={b} />
            ))}
          </section>
        ))}
      </div>
      <p style={{ marginTop: '1rem' }}>
        To accept, fill in your name and role, tick the box, and press Save.
      </p>
    </section>
  )
}
