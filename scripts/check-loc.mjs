#!/usr/bin/env node
/**
 * LOC-Cap Check — Kommentare und Leerzeilen zählen nicht.
 * Wirft Hard-Fail wenn eine Datei ihr Ownership-Cap reißt.
 */
import fs from 'node:fs'
import path from 'node:path'

const CAPS = [
  { prefix: 'packages/contracts/src', cap: 120, owner: 'contracts' },
  { prefix: 'packages/sim-core/src/prng', cap: 80, owner: 'prng' },
  { prefix: 'packages/sim-core/src/hash', cap: 80, owner: 'hash' },
  { prefix: 'packages/sim-core/src/math', cap: 120, owner: 'math' },
  { prefix: 'packages/sim-core/src/grid', cap: 150, owner: 'grid' },
  { prefix: 'packages/sim-core/src/combat', cap: 150, owner: 'combat' },
  { prefix: 'packages/sim-core/src/genome', cap: 150, owner: 'genome' },
  { prefix: 'packages/sim-core/src/items', cap: 150, owner: 'items' },
  { prefix: 'packages/sim-core/src/ghost', cap: 150, owner: 'ghost' },
  { prefix: 'packages/sim-core/src', cap: 150, owner: 'sim-core/fallback' },
  { prefix: 'packages/client/src/net', cap: 100, owner: 'net' },
  { prefix: 'packages/client/src/storage', cap: 100, owner: 'storage' },
  { prefix: 'packages/client/src/dungeon-editor', cap: 150, owner: 'dungeon-editor' },
  { prefix: 'packages/client/src/village', cap: 150, owner: 'village' },
  { prefix: 'packages/client/src/inventory', cap: 120, owner: 'inventory' },
  { prefix: 'packages/client/src/raid', cap: 150, owner: 'raid' },
  { prefix: 'packages/client/src/ui', cap: 120, owner: 'ui' },
  { prefix: 'packages/client/src', cap: 150, owner: 'client/fallback' },
  { prefix: 'packages/server/src/db', cap: 120, owner: 'db' },
  { prefix: 'packages/server/src/matchmaking', cap: 150, owner: 'matchmaking' },
  { prefix: 'packages/server/src/sync', cap: 150, owner: 'sync' },
  { prefix: 'packages/server/src', cap: 150, owner: 'server/fallback' },
  { prefix: 'scripts/shinon/plugins', cap: 150, owner: 'shinon/plugin' },
  { prefix: 'scripts/shinon/engine.mjs', cap: 200, owner: 'shinon/engine' },
  { prefix: 'scripts/shinon/install-hooks.mjs', cap: 200, owner: 'shinon/install' },
  { prefix: 'scripts/shinon', cap: 200, owner: 'shinon/fallback' },
  { prefix: 'scripts/bump-version.mjs', cap: 200, owner: 'tooling/version' },
  { prefix: 'scripts/check-loc.mjs', cap: 200, owner: 'tooling' },
  { prefix: 'scripts/check-hygiene.mjs', cap: 200, owner: 'tooling' },
]

const SOURCE_EXTS = new Set(['.ts', '.js', '.mjs', '.cjs', '.tsx', '.jsx'])
const IGNORE_DIRS = new Set(['node_modules', 'dist', '.git', '.husky', 'historisch', '.freebuff', 'coverage'])

function capFor(file) {
  // längster Prefix gewinnt
  let best = null
  for (const c of CAPS) {
    if (file === c.prefix || file.startsWith(c.prefix + '/')) {
      if (!best || c.prefix.length > best.prefix.length) best = c
    }
  }
  return best
}

function countCodeLines(content) {
  const lines = content.split('\n')
  let inBlock = false
  let code = 0
  for (let raw of lines) {
    let line = raw.trim()
    if (!inBlock) {
      if (line === '') continue
      // Block-Kommentar Start
      if (line.startsWith('/*')) {
        if (!line.includes('*/')) {
          inBlock = true
        }
        continue
      }
      if (line.startsWith('//')) continue
      if (line.startsWith('*')) continue
      if (line.startsWith('*/')) continue
      // Inline-Block auf einer Zeile: code /* comment */ — zählt als Code
      // Heuristik: Wenn Zeile Code vor /* enthält, zählt sie
      // Vereinfacht: Wenn Zeile nicht nur Kommentar ist, zählt sie
      // Entferne trailing // Kommentar für Erkennung nicht nötig
      code++
    } else {
      if (line.includes('*/')) inBlock = false
    }
  }
  return code
}

function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name)) continue
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, out)
    else if (e.isFile()) {
      const ext = path.extname(e.name)
      if (SOURCE_EXTS.has(ext)) out.push(full)
    }
  }
}

const root = process.cwd()
const files = []
// Nur relevante Roots scannen
for (const base of ['packages', 'scripts']) {
  const p = path.join(root, base)
  if (fs.existsSync(p)) walk(p, files)
}

let failed = false
const violations = []

for (const f of files) {
  const rel = path.relative(root, f).replaceAll(path.sep, '/')
  const cap = capFor(rel)
  if (!cap) continue
  const content = fs.readFileSync(f, 'utf8')
  const codeLines = countCodeLines(content)
  if (codeLines > cap.cap) {
    failed = true
    violations.push({ file: rel, lines: codeLines, cap: cap.cap, owner: cap.owner })
  }
}

if (failed) {
  console.error('💥 LOC-Cap Hard-Fail — folgende Dateien sprengen ihr Limit (Kommentare/Leerzeilen zählen nicht):\n')
  for (const v of violations) {
    console.error(`  ${v.file} — ${v.lines} Code-Zeilen > Cap ${v.cap} (Owner: ${v.owner})`)
  }
  console.error('\nFix: Splitte die Datei — eine Datei = ein Job. Kein God-File.')
  process.exit(1)
} else {
  console.log(`✅ LOC-Caps ok — ${files.length} Quelldateien geprüft, kein Cap gerissen.`)
}
