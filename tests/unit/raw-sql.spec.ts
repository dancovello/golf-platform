// Raw SQL must be built with Drizzle's sql`…` tag, which sends every ${value} as a separate
// parameter, never pasted into the SQL text (job 2, 21 Oct grilling). Reads the source only.
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import { lineOf, type Source, sourceFiles, walk } from '../shared/sourceScan'

const SQL_WORDS =
  /\b(select\s.+\sfrom|insert\s+into|update\s+\S+\s+set|delete\s+from|drop\s|alter\s+table|truncate\s)/is

const isSqlTag = (n: ts.Node) => ts.isTaggedTemplateExpression(n) && n.tag.getText() === 'sql'

const isBuiltString = (n: ts.Node) =>
  ts.isTemplateExpression(n) ||
  (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken)

/** Every way SQL could be built from pieces of text instead of parameters. */
export const unsafeSql = (sources: Source[]) => {
  const found: string[] = []
  for (const { file, tree } of sources) {
    walk(tree, (n) => {
      const at = `${file}:${lineOf(n)}`
      if (!ts.isCallExpression(n) && !isBuiltString(n)) return
      if (ts.isCallExpression(n)) {
        const callee = n.expression.getText()
        // sql.raw() pastes its text straight in. Only fixed text is allowed.
        if (callee === 'sql.raw') {
          const arg = n.arguments[0]
          if (!arg || !(ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))) {
            found.push(`${at} sql.raw() with text that isn't fixed`)
          }
        }
        // db.execute(…) / pool.query(…) given plain text instead of a sql`…` value.
        if (/\.(execute|query|unsafe)$/.test(callee)) {
          const arg = n.arguments[0]
          if (
            arg &&
            (ts.isStringLiteral(arg) ||
              ts.isNoSubstitutionTemplateLiteral(arg) ||
              isBuiltString(arg))
          ) {
            found.push(`${at} ${callee}() given text instead of sql\`…\``)
          }
        }
        return
      }
      // Text that looks like SQL, built by joining strings. Not reported again for: the body
      // of sql`…` itself (its values are parameters), the inner part of a longer a + b + c, or
      // text already reported above as what sql.raw()/execute()/query() was given.
      const parent = n.parent
      if (isSqlTag(parent)) return
      if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.PlusToken)
        return
      if (
        ts.isCallExpression(parent) &&
        /(^sql\.raw|\.(execute|query|unsafe))$/.test(parent.expression.getText())
      )
        return
      if (SQL_WORDS.test(n.getText())) found.push(`${at} SQL built by joining text`)
    })
  }
  return found
}

const parse = (code: string): Source[] => [
  { file: 'src/example.ts', tree: ts.createSourceFile('x.ts', code, ts.ScriptTarget.Latest, true) },
]

describe('raw SQL always uses parameters', () => {
  it('nothing in src/ builds SQL from pieces of text', () => {
    expect(unsafeSql(sourceFiles())).toEqual([])
  })

  it('catches the unsafe patterns', () => {
    const found = unsafeSql(
      parse(`
        db.execute(sql\`SELECT * FROM pages WHERE tenant_id = \${id}\`)
        db.execute(sql.raw(\`SELECT * FROM pages WHERE id = '\${id}'\`))
        pool.query("SELECT * FROM pages WHERE id = '" + id + "'")
        const q = \`DELETE FROM search_entries WHERE tenant_id = '\${id}'\`
        db.execute(sql.raw('SELECT 1'))
      `),
    )
    expect(found.map((f) => f.replace(/^src\/example\.ts:\d+ /, ''))).toEqual([
      "sql.raw() with text that isn't fixed",
      'pool.query() given text instead of sql`…`',
      'SQL built by joining text',
    ])
  })
})
