#!/usr/bin/env node
/** false-positive Plugin — Edge-Case Smoke für Etagen-Loop und State. */
import fs from 'node:fs'
import { collectSourceFiles, relativePath } from '../lib/source-scan.mjs'
import { POLICY } from '../policy.mjs'

const ROOT = process.cwd()
const { roots, extensions } = POLICY.falsePositive
const files = collectSourceFiles(roots, { extensions: new Set(extensions) })
let failed = false
for (const file of files) {
  const rel = relativePath(ROOT, file)
  const content = fs.readFileSync(file, 'utf8')
  if (content.includes('while (true)') || content.includes('while(true)')) {
    console.error(
      `💥 false-positive Fail — ${rel}: while(true) ohne Tick-Limit — Dead-Lock Gefahr`,
    )
    failed = true
  }
}
if (failed) process.exit(1)
console.log(
  `✅ false-positive ok — ${files.length} Dateien gescannt, keine Dead-Lock Muster.`,
)
