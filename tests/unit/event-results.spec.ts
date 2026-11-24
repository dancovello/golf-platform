import { describe, expect, it } from 'vitest'

import {
  columnHeading,
  hasBuiltInResults,
  parsePastedRows,
  resultColumns,
} from '@/collections/eventResultOptions'
import { toResults } from '@/site/events'

/** Results built into events (24 Nov 2026, event pages part 2). */
describe('results tables', () => {
  it('show the columns the club ticked, in a fixed order', () => {
    expect(resultColumns({})).toEqual(['position', 'name', 'score'])
    expect(
      resultColumns({ columns: ['note', 'gross', 'rounds', 'club', 'handicap'], rounds: '3' }),
    ).toEqual(['position', 'name', 'club', 'handicap', 'r1', 'r2', 'r3', 'gross', 'score', 'note'])
    expect(columnHeading('name', { who: 'teams' })).toBe('Team')
    expect(columnHeading('score', { score: 'nett' })).toBe('Nett')
  })

  it('read rows pasted from a spreadsheet (tabs), skipping a heading line', () => {
    const rows = parsePastedRows(
      'Pos\tName\tHcp\tPoints\n1\tTom Hardacre\t12\t42\n=2\t  Gareth  Pryce \t8\t40\n\n',
      { columns: ['handicap'] },
    )
    expect(rows).toEqual([
      { position: '1', name: 'Tom Hardacre', handicap: '12', score: '42' },
      { position: '=2', name: 'Gareth Pryce', handicap: '8', score: '40' },
    ])
  })

  it('read comma-separated rows, with quoted names', () => {
    const rows = parsePastedRows('1,"Smith, J / Jones, K",Heathcote,46.7\n2,A / B,Elsewhere,NR', {
      who: 'teams',
      columns: ['club'],
    })
    expect(rows[0]).toEqual({
      position: '1',
      name: 'Smith, J / Jones, K',
      club: 'Heathcote',
      score: '46.7',
    })
    expect(rows[1].score).toBe('NR')
  })

  it('stop at 200 rows', () => {
    const many = Array.from({ length: 250 }, (_, i) => `${i + 1}\tPlayer ${i}\t30`).join('\n')
    expect(parsePastedRows(many, {})).toHaveLength(200)
  })

  it('number positions the club left blank, and drop empty tables', () => {
    const results = toResults({
      resultTables: [
        {
          title: 'Overall',
          rows: [
            { name: 'A', score: '40' },
            { name: 'B', score: '38' },
          ],
        },
        { title: 'Empty', rows: [] },
      ],
    })
    expect(results?.tables.map((t) => t.title)).toEqual(['Overall'])
    expect(results?.tables[0].rows.map((r) => r.position)).toEqual(['1', '2'])
    expect(toResults({ resultTables: [{ title: 'Empty', rows: [] }] })).toBeNull()
  })

  it('count as results only when there is something to show', () => {
    expect(hasBuiltInResults({})).toBe(false)
    expect(hasBuiltInResults({ resultTables: [{ rows: [] }] })).toBe(false)
    expect(hasBuiltInResults({ prizes: [{}] })).toBe(true)
    expect(
      hasBuiltInResults({ resultsReport: { root: { children: [{ children: [{ text: ' ' }] }] } } }),
    ).toBe(false)
  })
})
