#!/usr/bin/env node
/** Redundancy-Gate — verhindert duplizierte Codeblöcke in Package-Quellen. */
import fs from 'node:fs'
import {
  collectSourceFiles,
  relativePath,
  stripComments,
} from '../lib/source-scan.mjs'
import { POLICY } from '../policy.mjs'

const ROOT = process.cwd()
const { roots, window: WINDOW } = POLICY.redundancy

function normalizedLines(content) {
  return stripComments(content)
    .split('\n')
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .filter(
      (line) =>
        line &&
        line !== '{' &&
        line !== '}' &&
        !line.startsWith('import ') &&
        !line.startsWith('export '),
    )
}

const files = collectSourceFiles(roots)
const occurrences = new Map()
for (const file of files) {
  const lines = normalizedLines(fs.readFileSync(file, 'utf8'))
  for (let index = 0; index <= lines.length - WINDOW; index++) {
    const block = lines.slice(index, index + WINDOW)
    const key = block.join('\n')
    if (!occurrences.has(key)) occurrences.set(key, [])
    occurrences
      .get(key)
      .push({ file: relativePath(ROOT, file), line: index + 1 })
  }
}
const failures = []
for (const [block, locations] of occurrences) {
  const uniqueFiles = new Set(locations.map((location) => location.file))
  if (uniqueFiles.size > 1)
    failures.push(
      `${[...uniqueFiles].join(' ↔ ')}: ${WINDOW} identische Codezeilen (${locations[0].line}/${locations[1].line})\n${block}`,
    )
}
if (failures.length > 0) {
  console.error('💥 Redundancy-Gate blockiert:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}
console.log(
  `✅ Redundancy-Gate ok — ${files.length} Package-Quellen, keine duplizierten ${WINDOW}-Zeilen-Blöcke.`,
)
