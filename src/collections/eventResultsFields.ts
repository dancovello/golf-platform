import type { CollectionBeforeValidateHook, Field, TextField } from 'payload'

import { clubRichText, dropEmptyPictures } from '../blocks/richText/lexical'
import { linkField } from '../fields/link'
import {
  hasBuiltInResults,
  parsePastedRows,
  RESULT_COLUMNS,
  RESULT_LIMITS,
  RESULT_SCORES,
  RESULT_WHO,
} from './eventResultOptions'

/**
 * Results built into an event (24 Nov 2026, plan part 2): a report, results tables, match
 * results and prize winners, all shown on the event's own page. The results link (G3) stays
 * for clubs that would rather upload their software's PDF.
 */

type Table = { who?: string; columns?: string[]; rounds?: string; paste?: string; rows?: unknown[] }

/** The table a row field sits in, from its path ("resultTables.0.rows.3.club"). */
const tableOf = (data: { resultTables?: Table[] } | undefined, path: (string | number)[]) => {
  const at = path.indexOf('resultTables')
  const index = at === -1 ? NaN : Number(path[at + 1])
  return Number.isInteger(index) ? data?.resultTables?.[index] : undefined
}

/** A row field shown only when its table has that column switched on. */
const whenColumn =
  (column: string) =>
  (data: Record<string, unknown>, _sibling: unknown, { path }: { path: (string | number)[] }) =>
    Boolean(tableOf(data as { resultTables?: Table[] }, path)?.columns?.includes(column))

/** Round fields: R1 to R4, as many as the table's "How many rounds". */
const whenRound =
  (n: number) =>
  (data: Record<string, unknown>, _sibling: unknown, { path }: { path: (string | number)[] }) => {
    const table = tableOf(data as { resultTables?: Table[] }, path)
    return Boolean(table?.columns?.includes('rounds') && n <= (Number(table.rounds) || 2))
  }

const short = (name: string, label: string, maxLength: number, width: string): TextField => ({
  name,
  label,
  type: 'text',
  maxLength,
  admin: { width },
})

const round = (n: number): TextField => ({
  name: `r${n}`,
  label: `R${n}`,
  type: 'text',
  maxLength: 6,
  admin: { width: '8%', condition: whenRound(n) as never },
})

export const eventResultsFields: Field[] = [
  {
    type: 'collapsible',
    label: 'Results (optional, after the day)',
    admin: {
      initCollapsed: true,
      description:
        'Shown on the event’s own page once it has taken place. Add as much or as little as you like: a short report, tables, match results or prize winners.',
    },
    fields: [
      {
        name: 'resultsReport',
        label: 'Report (optional)',
        type: 'richText',
        editor: clubRichText,
        hooks: { beforeValidate: [({ value }) => dropEmptyPictures(value)] },
        admin: { description: 'e.g. "Glorious sunshine for the Spring Open, and 84 players…"' },
      },
      {
        name: 'resultTables',
        label: 'Results tables',
        labels: { singular: 'Results table', plural: 'Results tables' },
        type: 'array',
        maxRows: RESULT_LIMITS.tables,
        admin: {
          initCollapsed: true,
          description:
            'One table for each list you publish: Overall, Division 1, Best gross, Ladies, Seniors… Several tables show as tabs.',
          components: { RowLabel: '@/admin/ResultTableLabel#ResultTableLabel' },
        },
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'title',
                label: 'Title',
                type: 'text',
                required: true,
                maxLength: 60,
                admin: { width: '40%', description: 'e.g. "Division 1" or "Best gross"' },
              },
              {
                name: 'who',
                label: 'Each row is',
                type: 'select',
                required: true,
                defaultValue: 'individuals',
                options: [...RESULT_WHO],
                admin: { width: '30%' },
              },
              {
                name: 'score',
                label: 'Score is',
                type: 'select',
                required: true,
                defaultValue: 'points',
                options: [...RESULT_SCORES],
                admin: { width: '30%' },
              },
            ],
          },
          {
            name: 'note',
            label: 'Note (optional)',
            type: 'text',
            maxLength: 120,
            admin: { description: 'e.g. "Handicap index 0 to 18.0" or "Playing handicap 95%"' },
          },
          {
            type: 'row',
            fields: [
              {
                name: 'columns',
                label: 'Extra columns (optional)',
                type: 'select',
                hasMany: true,
                options: [...RESULT_COLUMNS],
                admin: { width: '70%' },
              },
              {
                name: 'rounds',
                label: 'How many rounds',
                type: 'select',
                defaultValue: '2',
                options: ['2', '3', '4'],
                admin: {
                  width: '30%',
                  condition: (_data, sibling) => Boolean(sibling?.columns?.includes('rounds')),
                },
              },
            ],
          },
          {
            name: 'paste',
            label: 'Paste rows from a spreadsheet (optional)',
            type: 'textarea',
            virtual: true,
            admin: {
              rows: 4,
              description:
                'Copy the rows from HowDidiDo, IntelligentGolf or Excel and paste them here. When you save, they replace the rows below. Columns in this order: position, name, then any extra columns you ticked (club, handicap, rounds, gross), the score, then the note.',
            },
          },
          {
            name: 'rows',
            label: 'Rows',
            labels: { singular: 'Row', plural: 'Rows' },
            type: 'array',
            maxRows: RESULT_LIMITS.rows,
            admin: {
              initCollapsed: true,
              components: { RowLabel: '@/admin/ResultRowLabel#ResultRowLabel' },
            },
            fields: [
              {
                type: 'row',
                fields: [
                  {
                    name: 'position',
                    label: 'Pos',
                    type: 'text',
                    maxLength: 6,
                    admin: {
                      width: '8%',
                      description: 'Optional: filled in 1, 2, 3… Type "=2" for a tie.',
                    },
                  },
                  {
                    name: 'name',
                    label: 'Name',
                    type: 'text',
                    maxLength: 200,
                    admin: {
                      width: '30%',
                      description: 'Pairs and teams: separate the names with “/”.',
                    },
                  },
                  {
                    ...short('club', 'Club', 60, '16%'),
                    admin: { width: '16%', condition: whenColumn('club') as never },
                  },
                  {
                    ...short('handicap', 'Handicap', 10, '10%'),
                    admin: { width: '10%', condition: whenColumn('handicap') as never },
                  },
                  round(1),
                  round(2),
                  round(3),
                  round(4),
                  {
                    ...short('gross', 'Gross', 10, '8%'),
                    admin: { width: '8%', condition: whenColumn('gross') as never },
                  },
                  short('score', 'Score', 12, '10%'),
                  {
                    ...short('note', 'Note', 60, '20%'),
                    admin: { width: '20%', condition: whenColumn('note') as never },
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'matches',
        label: 'Match results (optional)',
        labels: { singular: 'Match', plural: 'Matches' },
        type: 'array',
        maxRows: RESULT_LIMITS.matches,
        admin: {
          initCollapsed: true,
          description:
            'For knockouts and match play: one row per match, grouped by round on the page. Add the final first.',
        },
        fields: [
          {
            type: 'row',
            fields: [
              short('round', 'Round', 40, '18%'),
              { ...short('sideA', 'Player or pair', 120, '26%'), required: true },
              { ...short('sideB', 'Against', 120, '26%'), required: true },
              {
                ...short('result', 'Result', 20, '12%'),
                admin: { width: '12%', description: 'e.g. "3 & 2" or "at 19th"' },
              },
              {
                name: 'winner',
                label: 'Won by',
                type: 'select',
                options: [
                  { label: 'First named', value: 'a' },
                  { label: 'Second named', value: 'b' },
                  { label: 'Halved', value: 'halved' },
                ],
                admin: { width: '18%' },
              },
            ],
          },
        ],
      },
      {
        name: 'prizes',
        label: 'Prize winners (optional)',
        labels: { singular: 'Prize', plural: 'Prizes' },
        type: 'array',
        maxRows: RESULT_LIMITS.prizes,
        admin: {
          initCollapsed: true,
          description: 'e.g. nearest the pin, longest drive, twos sweep.',
        },
        fields: [
          {
            type: 'row',
            fields: [
              { ...short('prize', 'Prize', 60, '30%'), required: true },
              { ...short('winner', 'Winner', 120, '35%'), required: true },
              {
                ...short('detail', 'Detail (optional)', 80, '35%'),
                admin: { width: '35%', description: 'e.g. "7th hole, 2 ft 3 in"' },
              },
            ],
          },
        ],
      },
      linkField({
        name: 'results',
        label: 'Results file or link (optional)',
        withLabel: false,
        required: false,
        allowDocument: true,
      }),
    ],
  },
  {
    // Kept by the save (fillResults) so the events page can find events with results quickly.
    name: 'hasResults',
    type: 'checkbox',
    defaultValue: false,
    index: true,
    admin: { hidden: true },
  },
]

/**
 * On save: rows pasted into a table replace its rows (the paste box itself is never stored),
 * and "has results" is worked out for the events page.
 */
export const fillResults: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  if (!data) return data
  if (Array.isArray(data.resultTables)) {
    data.resultTables = (data.resultTables as Table[]).map((table) => {
      const { paste, ...rest } = table
      return typeof paste === 'string' && paste.trim()
        ? { ...rest, rows: parsePastedRows(paste, table) }
        : rest
    })
  }
  data.hasResults = hasBuiltInResults({ ...originalDoc, ...data })
  return data
}
