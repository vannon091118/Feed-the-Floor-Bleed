#!/usr/bin/env node
/**
 * Shinon commit-msg Gate — lokaler Hook-Aufruf.
 * Die Regeln liegen in lib/commit-text.mjs, damit das Remote-Plugin
 * commit-integrity dieselben Verstöße findet (docs/REGELWERK_GIT.md).
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import { checkMessage } from './lib/commit-text.mjs'

const msgFile = process.argv[2]
if (!msgFile || !fs.existsSync(msgFile)) {
  console.error('💥 commit-msg Gate: keine Commit-Nachricht gefunden')
  process.exit(1)
}

let changed = []
try {
  changed = execSync('git diff --cached --name-only', { encoding: 'utf8' })
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
} catch (error) {
  console.error('💥 Commit-Gate Hard-Fail — staged Dateien nicht ermittelbar')
  console.error(`   ${error.message}`)
  process.exit(1)
}

const res = checkMessage(fs.readFileSync(msgFile, 'utf8'), changed)

if (!res.ok) {
  console.error('💥 Commit-Gate Hard-Fail:')
  for (const v of res.violations) console.error(`   - ${v}`)
  console.error(
    '   Kein KI-Footer, keine Bullets, ≥200 Wörter, jede Datei nennen.',
  )
  process.exit(1)
}

console.log(
  `✅ commit-msg Gate bestanden — ${res.words} Wörter, ${changed.length} Dateien genannt, kein verbotener Footer.`,
)
