/**
 * The data processing agreement's wording (src/agreement/text.ts): it covers every term
 * UK GDPR Article 28(3) requires, fills in the club's details, and its only gaps are the
 * square-bracketed ones left for Dan and his solicitor.
 */
import { describe, expect, it } from 'vitest'

import { agreementText } from '@/agreement/text'

const club = {
  clubName: 'Oakwood',
  legalName: 'Oakwood Golf Club Limited',
  address: '1 Lane\nTown',
}
const text = agreementText(club)
  .flatMap((s) => [
    s.title,
    ...s.blocks.flatMap((b) =>
      b.kind === 'list'
        ? b.items
        : b.kind === 'table'
          ? [b.caption, ...b.head, ...b.rows.flat()]
          : [b.text],
    ),
  ])
  .join('\n')

describe('data processing agreement', () => {
  it('names the club as controller, with its legal name and address', () => {
    expect(text).toContain('Oakwood Golf Club Limited, of 1 Lane, Town (“the Club”)')
    expect(text).toMatch(/The Club is the Controller/)
  })

  it('covers every Article 28(3) term', () => {
    for (const [term, pattern] of [
      [
        'processing details',
        /subject matter[\s\S]*Duration[\s\S]*Nature[\s\S]*Purpose[\s\S]*Types of Personal Data[\s\S]*Kinds of people/,
      ],
      [
        '(a) documented instructions, including transfers',
        /only on the Club’s documented instructions, including on transfers/,
      ],
      ['(b) confidentiality', /duty of confidentiality/],
      ['(c) Article 32 security', /Article 32/],
      [
        '(d) sub-processors: authorisation, notice, objection, flow-down, liability',
        /general written authorisation[\s\S]*object[\s\S]*Article 28\(4\)[\s\S]*fully liable/,
      ],
      ['(e) data subject rights', /using their rights/],
      ['(f) Articles 32 to 36 assistance', /Articles 32 to 36/],
      ['(g) delete or return at the end', /copy of its content[\s\S]*delete Club Personal Data/],
      ['(h) information and audits', /allow for and contribute to audits, including inspections/],
      ['infringing instructions', /breaks Data Protection Law/],
      ['breach notice', /Personal Data Breach/],
      ['international transfers', /International Data Transfer Agreement/],
      ['governing law', /England and Wales/],
    ] as const) {
      expect(text, term).toMatch(pattern)
    }
  })

  it('leaves no unfilled gaps except the bracketed ones for Dan and his solicitor', () => {
    expect(text).not.toMatch(/\{\{|\}\}|undefined|null|\[object/)
    const gaps = [...new Set(text.match(/\[[^\]]+\]/g) ?? [])]
    for (const gap of gaps) {
      expect(gap, gap).toMatch(
        /Provider|company number|registered office|privacy contact|Solicitor|USA|Club legal name/,
      )
    }
  })
})
