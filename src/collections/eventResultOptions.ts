/**
 * Results built into an event (24 Nov 2026, plan part 2). A plain module so the website and
 * the tests can use it without loading the CMS.
 *
 * The site never sorts or checks scores: it shows what the club entered, in the order entered
 * (club software already sorts them). That keeps every format working: stableford, medal,
 * scrambles with decimal scores, "NR" and "DQ".
 */

/** Who each row is: one player, a pair, or a team (names one per line). */
export const RESULT_WHO = [
  { label: 'Individuals', value: 'individuals' },
  { label: 'Pairs', value: 'pairs' },
  { label: 'Teams', value: 'teams' },
] as const
export type ResultWho = (typeof RESULT_WHO)[number]['value']

/** What the score column is called. */
export const RESULT_SCORES = [
  { label: 'Points', value: 'points' },
  { label: 'Nett', value: 'nett' },
  { label: 'Gross', value: 'gross' },
  { label: 'To par (+/−)', value: 'toPar' },
  { label: 'Score', value: 'score' },
] as const
export type ResultScore = (typeof RESULT_SCORES)[number]['value']

export const scoreHeading = (value: string | null | undefined) =>
  ({ points: 'Points', nett: 'Nett', gross: 'Gross', toPar: 'To par', score: 'Score' })[
    value as ResultScore
  ] ?? 'Score'

/** Extra columns a table can switch on. */
export const RESULT_COLUMNS = [
  { label: 'Home club', value: 'club' },
  { label: 'Handicap', value: 'handicap' },
  { label: 'Round scores (R1, R2 …)', value: 'rounds' },
  { label: 'Gross (beside the score)', value: 'gross' },
  { label: 'Note (e.g. “Countback: last 9”)', value: 'note' },
] as const
export type ResultColumn = (typeof RESULT_COLUMNS)[number]['value']

export type ResultRow = {
  position?: string | null
  name?: string | null
  club?: string | null
  handicap?: string | null
  r1?: string | null
  r2?: string | null
  r3?: string | null
  r4?: string | null
  gross?: string | null
  score?: string | null
  note?: string | null
}

type RowKey = keyof ResultRow

/** Limits, matched by the admin fields. */
export const RESULT_LIMITS = { tables: 10, rows: 200, matches: 64, prizes: 30 } as const

/**
 * The columns a table shows, in order, as row keys. Pasted rows are read in this same order,
 * so the help text and the paste always agree.
 */
export const resultColumns = (table: {
  who?: string | null
  columns?: string[] | null
  rounds?: number | string | null
}): RowKey[] => {
  const on = new Set(table.columns ?? [])
  const rounds = on.has('rounds') ? Math.min(Math.max(Number(table.rounds) || 2, 2), 4) : 0
  return [
    'position',
    'name',
    ...(on.has('club') ? (['club'] as const) : []),
    ...(on.has('handicap') ? (['handicap'] as const) : []),
    ...(['r1', 'r2', 'r3', 'r4'] as const).slice(0, rounds),
    ...(on.has('gross') ? (['gross'] as const) : []),
    'score',
    ...(on.has('note') ? (['note'] as const) : []),
  ]
}

/** Column headings, e.g. "Pos", "Player", "Club", "R1", "Points". */
export const columnHeading = (key: RowKey, table: { who?: string | null; score?: string | null }) =>
  ({
    position: 'Pos',
    name: table.who === 'pairs' ? 'Pair' : table.who === 'teams' ? 'Team' : 'Player',
    club: 'Club',
    handicap: 'Handicap',
    r1: 'R1',
    r2: 'R2',
    r3: 'R3',
    r4: 'R4',
    gross: 'Gross',
    score: scoreHeading(table.score),
    note: 'Note',
  })[key]

/** One line of comma-separated text, allowing "quoted, values". */
const splitCSV = (line: string) => {
  const cells: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      cells.push(cell)
      cell = ''
    } else cell += c
  }
  cells.push(cell)
  return cells
}

const HEADER = /^(pos|position|place|rank|no\.?|#|name|player|team|pair)$/i

/**
 * Rows pasted from a spreadsheet or club software (HowDidiDo, IntelligentGolf, Excel): one
 * line per row, cells split by tabs (what copying from a table gives), or by commas when a line
 * has no tabs. Cells are read in the table's column order (resultColumns). A heading line
 * ("Pos, Name, …") is skipped. Text is trimmed and cut to the field limits; at most 200 rows.
 */
export const parsePastedRows = (
  text: string,
  table: { who?: string | null; columns?: string[] | null; rounds?: number | string | null },
): ResultRow[] => {
  const keys = resultColumns(table)
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter((l) => l.trim() !== '')
  const rows: ResultRow[] = []
  for (const [i, line] of lines.entries()) {
    const cells = (line.includes('\t') ? line.split('\t') : splitCSV(line)).map((c) =>
      c.replace(/\s+/g, ' ').trim(),
    )
    if (i === 0 && (HEADER.test(cells[0] ?? '') || HEADER.test(cells[1] ?? ''))) continue
    const row: ResultRow = {}
    keys.forEach((key, k) => {
      const value = cells[k] ?? ''
      if (value) row[key] = value.slice(0, key === 'name' ? 200 : key === 'note' ? 60 : 40)
    })
    if (Object.keys(row).length > 0) rows.push(row)
    if (rows.length >= RESULT_LIMITS.rows) break
  }
  return rows
}

/** Whether an event has any results built in (a table with rows, a match, a prize or a report). */
export const hasBuiltInResults = (data: {
  resultTables?: { rows?: unknown[] | null }[] | null
  matches?: unknown[] | null
  prizes?: unknown[] | null
  resultsReport?: unknown
}) =>
  Boolean(
    data.resultTables?.some((t) => (t.rows?.length ?? 0) > 0) ||
    data.matches?.length ||
    data.prizes?.length ||
    richTextHasText(data.resultsReport),
  )

/** Whether a rich-text value has any words or pictures in it. */
export const richTextHasText = (value: unknown): boolean => {
  const walk = (node: unknown): boolean => {
    if (!node || typeof node !== 'object') return false
    const n = node as { type?: string; text?: string; children?: unknown[] }
    if (typeof n.text === 'string' && n.text.trim()) return true
    if (n.type === 'upload') return true
    return (n.children ?? []).some(walk)
  }
  return walk((value as { root?: unknown } | null)?.root)
}
