#!/usr/bin/env node
/**
 * bump-version — mechanische Versionserhöhung.
 * Regel: PATCH 0..99, MINOR 0..99, bei 99→0 + Carry. Kein manueller Eingriff.
 * Trigger: jeder erfolgreiche Push / post-commit. Aufruf: node scripts/bump-version.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const VERSION_FILE = path.join(ROOT, 'VERSION')
const PACKAGE_FILES = [
  path.join(ROOT, 'package.json'),
  path.join(ROOT, 'packages/contracts/package.json'),
  path.join(ROOT, 'packages/sim-core/package.json'),
  path.join(ROOT, 'packages/client/package.json'),
  path.join(ROOT, 'packages/server/package.json'),
]

function parse(v) {
  const m = v.trim().match(/^(\d+)\.(\d+)\.(\d+)$/)
  if (!m) throw new Error(`Ungültige Version "${v}" — erwartet X.Y.Z`)
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) }
}

function bump({ major, minor, patch }) {
  patch += 1
  if (patch > 99) {
    patch = 0
    minor += 1
    if (minor > 99) {
      minor = 0
      major += 1
    }
  }
  return { major, minor, patch }
}

function fmt({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`
}

function main() {
  const raw = fs.readFileSync(VERSION_FILE, 'utf8')
  const cur = parse(raw)
  const next = bump(cur)
  const nextStr = fmt(next)

  const toUpdate = []
  for (const pf of PACKAGE_FILES) {
    if (!fs.existsSync(pf)) continue
    let content
    try {
      content = fs.readFileSync(pf, 'utf8')
    } catch (e) {
      throw new Error(`Kann ${path.relative(ROOT, pf)} nicht lesen: ${e.message}`)
    }
    let pkg
    try {
      pkg = JSON.parse(content)
    } catch (e) {
      throw new Error(`Ungültiges JSON in ${path.relative(ROOT, pf)}: ${e.message}`)
    }
    if (pkg.version !== nextStr) toUpdate.push({ pf, pkg, original: content })
  }

  const prevVersion = raw
  fs.writeFileSync(VERSION_FILE, nextStr + '\n', 'utf8')
  console.log(`🦊 Version bump: ${fmt(cur)} → ${nextStr}`)

  try {
    for (const { pf, pkg } of toUpdate) {
      pkg.version = nextStr
      fs.writeFileSync(pf, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
      console.log(`  ✓ ${path.relative(ROOT, pf)} → ${nextStr}`)
    }
  } catch (e) {
    try {
      fs.writeFileSync(VERSION_FILE, prevVersion, 'utf8')
    } catch {}
    for (const { pf, original } of toUpdate) {
      try {
        if (fs.existsSync(pf)) fs.writeFileSync(pf, original, 'utf8')
      } catch {}
    }
    throw e
  }
}

try {
  main()
} catch (e) {
  console.error(`💥 bump-version Fail — ${e.message}`)
  process.exit(1)
}
