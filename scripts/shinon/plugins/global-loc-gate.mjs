#!/usr/bin/env node
/** Globaler LOC-Check — jede Quelle muss den dynamisch abgeleiteten Datei-Cap einhalten. */
import fs from 'node:fs'
import path from 'node:path'
import {
  collectSourceFiles,
  countCodeLines,
  relativePath,
} from '../lib/source-scan.mjs'
import { POLICY } from '../policy.mjs'

const ROOT = process.cwd()
const { roots } = POLICY.globalLoc
const fileCap = Math.max(...POLICY.locCaps.map((entry) => entry.cap))
const files = collectSourceFiles(roots.map((root) => path.join(ROOT, root)))
let total = 0
const violations = []
for (const file of files) {
  const lines = countCodeLines(fs.readFileSync(file, 'utf8'))
  total += lines
  if (lines > fileCap)
    violations.push(`${relativePath(ROOT, file)}: ${lines} > ${fileCap} LOC`)
}
if (violations.length > 0) {
  console.error('💥 Globaler LOC-Gate blockiert:')
  for (const violation of violations) console.error(`  - ${violation}`)
  process.exit(1)
}
console.log(
  `✅ Globaler LOC-Gate ok — ${files.length} Quellen, ${total} LOC, dynamischer Datei-Cap ${fileCap}.`,
)
