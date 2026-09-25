#!/usr/bin/env node
/**
 * LOC-Cap Check — Kommentare und Leerzeilen zählen nicht.
 * Wirft Hard-Fail wenn eine Datei ihr Ownership-Cap reißt.
 */
import fs from 'node:fs'
import path from 'node:path'
import {
  collectSourceFiles,
  countCodeLines,
  relativePath,
} from './shinon/lib/source-scan.mjs'
import { POLICY } from './shinon/policy.mjs'

const CAPS = POLICY.locCaps

function capFor(file) {
  // längster Prefix gewinnt
  let best = null
  for (const c of CAPS) {
    if (file === c.prefix || file.startsWith(`${c.prefix}/`)) {
      if (!best || c.prefix.length > best.prefix.length) best = c
    }
  }
  return best
}

const root = process.cwd()
const files = collectSourceFiles(
  ['packages', 'scripts'].map((base) => path.join(root, base)),
)

let failed = false
const violations = []

for (const f of files) {
  const rel = relativePath(root, f)
  const cap = capFor(rel)
  if (!cap) continue
  const content = fs.readFileSync(f, 'utf8')
  const codeLines = countCodeLines(content)
  if (codeLines > cap.cap) {
    failed = true
    violations.push({
      file: rel,
      lines: codeLines,
      cap: cap.cap,
      owner: cap.owner,
    })
  }
}

if (failed) {
  console.error(
    '💥 LOC-Cap Hard-Fail — folgende Dateien sprengen ihr Limit (Kommentare/Leerzeilen zählen nicht):\n',
  )
  for (const v of violations) {
    console.error(
      `  ${v.file} — ${v.lines} Code-Zeilen > Cap ${v.cap} (Owner: ${v.owner})`,
    )
  }
  console.error(
    '\nFix: Splitte die Datei — eine Datei = ein Job. Kein God-File.',
  )
  process.exit(1)
} else {
  console.log(
    `✅ LOC-Caps ok — ${files.length} Quelldateien geprüft, kein Cap gerissen.`,
  )
}
