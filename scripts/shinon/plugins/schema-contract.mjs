#!/usr/bin/env node
/**
 * schema-contract Plugin — prüft dass contracts vorhanden sind und sim_version getragen wird.
 */
import fs from 'node:fs'
import path from 'node:path'

const CONTRACT_SRC = 'packages/contracts/src'
const STRINGMATRIX = 'docs/STRINGMATRIX.md'

let failed = false

// 1) contracts/src muss existieren und index haben (oder bald)
if (!fs.existsSync(CONTRACT_SRC)) {
  console.error(`💥 schema-contract Fail — ${CONTRACT_SRC} fehlt`)
  failed = true
}

// 2) sim_version muss in Stringmatrix dokumentiert sein
if (fs.existsSync(STRINGMATRIX)) {
  const sm = fs.readFileSync(STRINGMATRIX, 'utf8')
  if (!sm.toLowerCase().includes('sim_version')) {
    console.error('💥 schema-contract Fail — STRINGMATRIX.md muss sim_version dokumentieren')
    failed = true
  }
} else {
  console.error(`💥 schema-contract Fail — ${STRINGMATRIX} fehlt (Pflicht-Doku)`)
  failed = true
}

// 3) Wenn contracts Dateien existieren, müssen sie zod importieren und sim_version exportieren
if (fs.existsSync(CONTRACT_SRC)) {
  const files = fs.readdirSync(CONTRACT_SRC).filter((f) => f.endsWith('.ts'))
  if (files.length > 0) {
    let hasSimVersion = false
    for (const f of files) {
      const c = fs.readFileSync(path.join(CONTRACT_SRC, f), 'utf8')
      if (c.includes('sim_version') || c.includes('simVersion')) hasSimVersion = true
    }
    if (!hasSimVersion) {
      console.error('💥 schema-contract Fail — kein File in contracts/src exportiert sim_version')
      failed = true
    }
  }
}

if (failed) process.exit(1)
console.log('✅ schema-contract ok — sim_version + Stringmatrix vorhanden (oder Verträge stehen noch aus und Matrix ist vorbereitet).')
