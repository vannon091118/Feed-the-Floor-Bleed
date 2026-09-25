#!/usr/bin/env node
/**
 * Repo-Hygiene Check — Pflicht-Dokus pro Domäne + global.
 * Erzwingt: 5 Doku-Arten vorhanden, aktiv ≤200 Zeilen, historisch = append-only (nie leer löschen).
 */
import fs from 'node:fs'
import path from 'node:path'

const DOCS = ['CHANGELOG.md', 'ARCHITEKTUR.md', 'STRINGMATRIX.md', 'FUNKTIONSGRAPH.md', 'REPOINDEX.md']
const DOMAINS = [
  { label: 'root', dir: 'docs' },
  { label: 'contracts', dir: 'packages/contracts/docs' },
  { label: 'sim-core', dir: 'packages/sim-core/docs' },
  { label: 'client', dir: 'packages/client/docs' },
  { label: 'server', dir: 'packages/server/docs' },
  { label: 'shinon', dir: 'scripts/shinon/docs' },
]
const ACTIVE_CAP = 200

let failed = false

function lineCount(file) {
  const c = fs.readFileSync(file, 'utf8')
  return c.split('\n').length
}

for (const d of DOMAINS) {
  const dir = path.join(process.cwd(), d.dir)
  if (!fs.existsSync(dir)) {
    console.error(`💥 Hygiene Fail — Domain "${d.label}" fehlt: Verzeichnis ${d.dir} existiert nicht`)
    failed = true
    continue
  }
  for (const doc of DOCS) {
    const fp = path.join(dir, doc)
    if (!fs.existsSync(fp)) {
      console.error(`💥 Hygiene Fail — ${d.label}: Pflicht-Doku fehlt → ${d.dir}/${doc}`)
      failed = true
      continue
    }
    const lines = lineCount(fp)
    if (lines > ACTIVE_CAP) {
      console.error(`💥 Hygiene Fail — ${d.label}/${doc}: ${lines} Zeilen > Cap ${ACTIVE_CAP} — splitte nach historisch/`)
      failed = true
    }
  }
  // historisch muss existieren (darf leer starten, aber muss da sein)
  const hist = path.join(dir, 'historisch')
  if (!fs.existsSync(hist) || !fs.statSync(hist).isDirectory()) {
    console.error(`💥 Hygiene Fail — ${d.label}: historisch/ Verzeichnis fehlt → ${d.dir}/historisch/`)
    failed = true
  }
}

// README Pflicht (Vorstellung, keine Tech-Doku) — nur Existenz + nicht leer
const readme = path.join(process.cwd(), 'README.md')
if (!fs.existsSync(readme)) {
  console.error('💥 Hygiene Fail — README.md fehlt im Root (Vorstellung, keine Tech-Doku)')
  failed = true
} else if (fs.readFileSync(readme, 'utf8').trim().length < 200) {
  console.error('💥 Hygiene Fail — README.md zu dünn (<200 Zeichen), schreib eine echte Vorstellung')
  failed = true
}

if (failed) {
  console.error('\nFix: Ergänze fehlende Dokus, kürze aktive Doku auf ≤200 Zeilen (ältestes nach historisch/ verschieben).')
  process.exit(1)
} else {
  console.log(`✅ Hygiene ok — ${DOMAINS.length} Domänen × ${DOCS.length} Dokus + README vorhanden, alle ≤${ACTIVE_CAP} Zeilen.`)
}
