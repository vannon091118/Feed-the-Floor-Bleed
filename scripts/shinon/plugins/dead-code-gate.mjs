#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
/**
 * Dead-Code-Gate — der einzige Typecheck-Lauf plus AST-basierte Dead-Code-Muster.
 *
 * `noUnusedLocals` und `noUnusedParameters` stehen seit dem 2026-09-29 in
 * `tsconfig.json` und nicht mehr auf dieser Kommandozeile: Der Typecheck hat
 * genau einen Owner, und das ist der Programmlauf, den dieses Plugin fährt.
 * `pnpm run -s typecheck` fährt dasselbe Programm für den Einzelfall.
 */
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { collectSourceFiles, relativePath } from '../lib/source-scan.mjs'
import { POLICY } from '../policy.mjs'

const ROOT = process.cwd()
const failures = []

/**
 * @param {string} file
 * @returns {ts.ScriptKind}
 */
function scriptKind(file) {
  if (file.endsWith('.tsx')) return ts.ScriptKind.TSX
  if (file.endsWith('.jsx')) return ts.ScriptKind.JSX
  if (file.endsWith('.ts')) return ts.ScriptKind.TS
  return ts.ScriptKind.JS
}

/**
 * @param {string} file
 * @param {string} content
 * @returns {string}
 */
function deadCodePattern(file, content) {
  const source = ts.createSourceFile(
    file,
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(file),
  )
  let message = ''
  /** @param {ts.Node} node */
  function visit(node) {
    if (message) return
    if (node.kind === ts.SyntaxKind.DebuggerStatement) message = 'debugger'
    if (
      (ts.isIfStatement(node) || ts.isWhileStatement(node)) &&
      node.expression.kind === ts.SyntaxKind.FalseKeyword
    ) {
      message = ts.isIfStatement(node) ? 'if (false)' : 'while (false)'
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return message
}

const files = collectSourceFiles(POLICY.deadCode.roots)
for (const file of files) {
  const rel = relativePath(ROOT, file)
  const message = deadCodePattern(rel, fs.readFileSync(file, 'utf8'))
  if (message) failures.push(`${rel}: ${message} ist blockierender Dead-Code`)
}

// Tests dürfen einen leichten Double als SHINON_TSC injizieren; der normale Lauf nutzt TypeScript.
// Keine Flags auf der Kommandozeile: das tsconfig trägt sie, sonst liefe derselbe
// Typecheck mit zwei verschiedenen Regelsätzen je nach Aufrufer.
const tsc =
  process.env.SHINON_TSC ||
  path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc')
if (!fs.existsSync(tsc))
  failures.push(
    'node_modules/typescript/bin/tsc fehlt — Typecheck und NoUnused-Prüfung nicht ausführbar',
  )
else {
  const result = spawnSync(
    process.execPath,
    [tsc, '--noEmit', '-p', path.join(ROOT, 'tsconfig.json')],
    {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 60_000,
    },
  )
  if (result.status !== 0)
    failures.push(
      `TypeScript-Programmlauf fehlgeschlagen:\n${(result.stdout || result.stderr || '').trim()}`,
    )
}
if (failures.length > 0) {
  console.error('💥 Dead-Code-Gate blockiert:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}
console.log(
  `✅ Dead-Code-Gate ok — Typecheck und NoUnused über das tsconfig-Programm (packages/*/src, packages/*/test, scripts/**/* mit .mjs), AST-Muster über ${files.length} Quellen inklusive .mjs.`,
)
