/**
 * Reads the app's own source files (src/, without migrations) as TypeScript syntax trees, for
 * the safety checks that look at how code is written (tests/unit/override-allowlist.spec.ts,
 * tests/unit/raw-sql.spec.ts). Nothing is run.
 */
import fs from 'node:fs'
import path from 'node:path'

import ts from 'typescript'

export const ROOT = path.resolve(import.meta.dirname, '../..')

export type Source = { file: string; tree: ts.SourceFile }

/** Every .ts and .tsx file under src/, except database migrations (generated SQL). */
export const sourceFiles = (dir = path.join(ROOT, 'src')): Source[] => {
  const out: Source[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'migrations') continue
      out.push(...sourceFiles(full))
    } else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      const text = fs.readFileSync(full, 'utf8')
      out.push({
        file: path.relative(ROOT, full),
        tree: ts.createSourceFile(full, text, ts.ScriptTarget.Latest, true),
      })
    }
  }
  return out
}

export const walk = (node: ts.Node, visit: (n: ts.Node) => void) => {
  visit(node)
  ts.forEachChild(node, (child) => walk(child, visit))
}

export const lineOf = (node: ts.Node) =>
  node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line + 1

const nameOf = (node: ts.Node | undefined): string | null =>
  node && (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isPrivateIdentifier(node))
    ? node.text
    : null

/**
 * The name of the function a piece of code is in: a named function or method, or the variable
 * or object property an unnamed function is assigned to (`const loadX = cache(async () => …)`,
 * `afterChange: [async () => …]`). Code outside any function is "(top level)".
 */
export const enclosingFunction = (node: ts.Node): string => {
  for (let p: ts.Node | undefined = node.parent; p; p = p.parent) {
    if (ts.isFunctionDeclaration(p) || ts.isMethodDeclaration(p)) {
      const name = nameOf(p.name)
      if (name) return name
    }
    if (ts.isArrowFunction(p) || ts.isFunctionExpression(p)) {
      for (let q: ts.Node | undefined = p.parent; q; q = q.parent) {
        if (ts.isVariableDeclaration(q) || ts.isPropertyAssignment(q)) {
          const name = nameOf(q.name)
          if (name) return name
        }
        if (ts.isFunctionLike(q) || ts.isSourceFile(q)) break
      }
    }
  }
  return '(top level)'
}

/** Payload's server-side (Local API) operations, which skip access rules unless told not to. */
export const LOCAL_API_OPERATIONS = new Set([
  'find',
  'findByID',
  'findDistinct',
  'count',
  'create',
  'update',
  'delete',
  'duplicate',
  'findVersions',
  'findVersionByID',
  'countVersions',
  'restoreVersion',
  'findGlobal',
  'updateGlobal',
  'findGlobalVersions',
  'findGlobalVersionByID',
  'restoreGlobalVersion',
])

export type AccessSkip = { file: string; fn: string; line: number; how: string }

/**
 * Every place that skips Payload's access rules:
 * - `overrideAccess` set to anything but `false`, and
 * - a Local API call (`payload.find({ collection: … })` and the like) that doesn't say
 *   `overrideAccess` at all: Payload then skips the rules by default.
 */
export const accessSkips = (sources = sourceFiles()): AccessSkip[] => {
  const found: AccessSkip[] = []
  for (const { file, tree } of sources) {
    walk(tree, (n) => {
      if (
        ts.isPropertyAssignment(n) &&
        nameOf(n.name) === 'overrideAccess' &&
        n.initializer.kind !== ts.SyntaxKind.FalseKeyword
      ) {
        found.push({
          file,
          fn: enclosingFunction(n),
          line: lineOf(n),
          how: n.initializer.getText(),
        })
      }
      if (ts.isShorthandPropertyAssignment(n) && n.name.text === 'overrideAccess') {
        found.push({ file, fn: enclosingFunction(n), line: lineOf(n), how: 'overrideAccess' })
      }
      if (
        ts.isCallExpression(n) &&
        ts.isPropertyAccessExpression(n.expression) &&
        LOCAL_API_OPERATIONS.has(n.expression.name.text)
      ) {
        const arg = n.arguments[0]
        if (!arg || !ts.isObjectLiteralExpression(arg)) return
        const keys = arg.properties.map((p) => nameOf(p.name)).filter(Boolean)
        const isPayloadCall = keys.includes('collection') || keys.includes('slug')
        if (isPayloadCall && !keys.includes('overrideAccess')) {
          found.push({ file, fn: enclosingFunction(n), line: lineOf(n), how: 'not set (default)' })
        }
      }
    })
  }
  return found
}
