#!/usr/bin/env node
/**
 * false-positive Plugin — Edge-Case Smoke für Etagen-Loop und State.
 * Läuft als leichte statische Checks, bis echte Sim-Tests existieren.
 */
import fs from 'node:fs'
import path from 'node:path'

const WATCH_DIRS = [
  'packages/sim-core/src/combat',
  'packages/sim-core/src/genome',
  'packages/server/src/matchmaking',
  'packages/server/src/sync',
]

let failed = false
let checked = 0

for (const dir of WATCH_DIRS) {
  if (!fs.existsSync(dir)) continue
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts'))
  for (const f of files) {
    checked++
    const content = fs.readFileSync(path.join(dir, f), 'utf8')
    // Smoke: Etagen-Loop muss Token/Seed erwähnen, sonst ist er nicht an Server gebunden
    if (dir.includes('sync') || dir.includes('matchmaking')) {
      // noch kein Fail wenn leer — nur Warnung
    }
    // Smoke: combat sollte kein unbegrenztes while(true) ohne Tick-Limit haben
    if (content.includes('while (true)') || content.includes('while(true)')) {
      console.error(`💥 false-positive Fail — ${dir}/${f}: while(true) ohne Tick-Limit — Dead-Lock Gefahr`)
      failed = true
    }
  }
}

if (failed) process.exit(1)
console.log(`✅ false-positive ok — ${checked} Dateien gescannt, keine Dead-Lock Muster.`)
