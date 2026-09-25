#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
/** Dead-Code-Gate — TypeScript-NoUnused plus AST-basierte Dead-Code-Muster. */
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { collectSourceFiles, relativePath } from '../lib/source-scan.mjs'
import { POLICY } from '../policy.mjs'

const ROOT = process.cwd()
const failures = []

function scriptKind(file) {
  if (file.endsWith('.tsx')) return ts.ScriptKind.TSX
  if (file.endsWith('.jsx')) return ts.ScriptKind.JSX
  if (file.endsWith('.ts')) return ts.ScriptKind.TS
  return ts.ScriptKind.JS
}

function deadCodePattern(file, content) {
  const source = ts.createSourceFile(
    file,
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(file),
  )
  let message = ''
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
const tsc =
  process.env.SHINON_TSC ||
  path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc')
if (!fs.existsSync(tsc))
  failures.push(
    'node_modules/typescript/bin/tsc fehlt — NoUnused-Prüfung nicht ausführbar',
  )
else {
  const result = spawnSync(
    process.execPath,
    [tsc, '--noEmit', '--noUnusedLocals', '--noUnusedParameters'],
    {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 60_000,
    },
  )
  if (result.status !== 0)
    failures.push(
      `TypeScript NoUnused fehlgeschlagen:\n${(result.stdout || result.stderr || '').trim()}`,
    )
}
if (failures.length > 0) {
  console.error('💥 Dead-Code-Gate blockiert:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}
console.log(
  `✅ Dead-Code-Gate ok — ${files.length} Quellen, NoUnused und AST-Muster geprüft.`,
)
