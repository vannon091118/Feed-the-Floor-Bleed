#!/usr/bin/env node
/**
 * version-gate Plugin — prüft dass VERSION und alle package.json Versionen synchron sind
 * und dass VERSION dem Schema X.Y.Z mit 0..99 Range folgt.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const VERSION_FILE = path.join(ROOT, 'VERSION')
const PKGS = [
  'package.json',
  'packages/contracts/package.json',
  'packages/sim-core/package.json',
  'packages/client/package.json',
  'packages/server/package.json',
]

let failed = false

if (!fs.existsSync(VERSION_FILE)) {
  console.error('💥 version-gate Fail — VERSION Datei fehlt im Root')
  process.exit(1)
}

const raw = fs.readFileSync(VERSION_FILE, 'utf8').trim()
const m = raw.match(/^(\d+)\.(\d+)\.(\d+)$/)
if (!m) {
  console.error(`💥 version-gate Fail — VERSION "${raw}" ungültig, erwartet X.Y.Z`)
  process.exit(1)
}

const minor = Number(m[2])
const patch = Number(m[3])
if (minor > 99 || patch > 99) {
  console.error(`💥 version-gate Fail — VERSION "${raw}" Minor/Patch >99 — nutze bump-version.mjs`)
  failed = true
}

for (const rel of PKGS) {
  const full = path.join(ROOT, rel)
  if (!fs.existsSync(full)) continue
  const pkg = JSON.parse(fs.readFileSync(full, 'utf8'))
  if (pkg.version !== raw) {
    console.error(`💥 version-gate Fail — ${rel} version "${pkg.version}" != VERSION "${raw}"`)
    failed = true
  }
}

if (failed) process.exit(1)
console.log(`✅ version-gate ok — VERSION ${raw} synchron in ${PKGS.length} package.json`)
