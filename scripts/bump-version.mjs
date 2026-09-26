#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
/**
 * bump-version — Next-Bump-Zähler mit maßgeblicher Basis aus dem Online-Stand.
 *
 * Regel: PATCH 0..99, MINOR 0..99, bei 99→0 + Carry. Kein manueller Eingriff.
 * Trigger: jeder erfolgreiche Commit über den post-commit-Hook.
 *
 * Die Basis ist nicht die lokale Datei, sondern der Stand von main auf dem
 * Remote. Ein Arbeitsbranch, der hinter main liegt, zählt sonst aus seinem
 * eigenen alten Stand hoch und vergibt genau die Nummer, die ein paralleler
 * Branch schon vergeben hat. Auf main ist so am 2026-09-26 genau eine
 * Doppelvergabe entstanden: 0.0.37 auf 222d2a2 und noch einmal auf fb5f5bc.
 *
 * Modi: ohne Argument wird geschrieben. `--next` fragt nur und schreibt die
 * Nummer auf stdout, alle Diagnosen gehen auf stderr. `--ref <name>` legt
 * eine andere Basis fest.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const VERSION_FILE = path.join(ROOT, 'VERSION')
const BASE_REF = 'origin/main'
const FALLBACK_REF = 'main'
const HISTORY_LIMIT = 50
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

function replaceVersion(content, version, file) {
  const pattern = /("version"\s*:\s*")[^"]+(")/
  if (!pattern.test(content))
    throw new Error(`Kein version-Feld in ${path.relative(ROOT, file)}`)
  return content.replace(pattern, `$1${version}$2`)
}

/** Ein git-Aufruf. Scheitert er oder gibt es die Ref nicht, ist das `null`. */
function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

/**
 * Die maßgebliche Basis. Online zuerst, damit zwei Arbeitskopien nicht auf
 * unterschiedlichen lokalen Ständen zählen; ohne Netz fällt der Zähler auf
 * den lokalen main-Zweig zurück und sagt das vorher.
 */
function authorityBase(explicitRef) {
  for (const ref of explicitRef ? [explicitRef] : [BASE_REF, FALLBACK_REF]) {
    const version = git(['show', `${ref}:VERSION`])
    if (version) return { ref, version }
  }
  return null
}

/**
 * Welche VERSION-Werte die Basis in ihren letzten Bump-Commits trug. Nur die
 * jüngsten HISTORY_LIMIT werden gelesen, weil eine Kollision aus der fernen
 * Vergangenheit nichts mehr zu entscheiden hat. Der Aufruf sitzt im Hook und
 * darf deshalb nicht fünfzig Prozesse kosten: `git cat-file --batch` liest
 * alle Inhalte in einem Durchgang.
 */
function usedVersions(ref) {
  const used = new Set()
  const shas = git([
    'log',
    ref,
    '--format=%H',
    '-n',
    String(HISTORY_LIMIT),
    '--',
    'VERSION',
  ])
  if (!shas) return used
  const requests = shas
    .split('\n')
    .filter(Boolean)
    .map((sha) => `${sha}:VERSION`)
    .join('\n')
  let batch
  try {
    batch = execFileSync('git', ['cat-file', '--batch'], {
      cwd: ROOT,
      input: `${requests}\n`,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    })
  } catch {
    return used
  }
  let pos = 0
  while (pos < batch.length) {
    const lineEnd = batch.indexOf('\n', pos)
    if (lineEnd === -1) break
    const [, type, size] = batch.slice(pos, lineEnd).split(' ')
    const start = lineEnd + 1
    if (type === 'blob')
      used.add(batch.slice(start, start + Number(size)).trim())
    pos = start + Number(size) + 1
  }
  return used
}

function readLocal() {
  return fmt(parse(fs.readFileSync(VERSION_FILE, 'utf8')))
}

/** Schreibt den neuen Stand in VERSION und alle Manifeste, mit Rückfall. */
function write(next, previous) {
  const toUpdate = []
  for (const pf of PACKAGE_FILES) {
    if (!fs.existsSync(pf)) continue
    const content = fs.readFileSync(pf, 'utf8')
    let pkg
    try {
      pkg = JSON.parse(content)
    } catch (e) {
      throw new Error(
        `Ungültiges JSON in ${path.relative(ROOT, pf)}: ${e.message}`,
      )
    }
    if (pkg.version !== next) toUpdate.push({ pf, content })
  }

  fs.writeFileSync(VERSION_FILE, `${next}\n`, 'utf8')
  console.log(`🦊 Version bump: ${previous} → ${next}`)

  try {
    for (const { pf, content } of toUpdate) {
      fs.writeFileSync(pf, replaceVersion(content, next, pf), 'utf8')
      console.log(`  ✓ ${path.relative(ROOT, pf)} → ${next}`)
    }
  } catch (e) {
    try {
      fs.writeFileSync(VERSION_FILE, `${previous}\n`, 'utf8')
    } catch {}
    for (const { pf, content } of toUpdate) {
      try {
        if (fs.existsSync(pf)) fs.writeFileSync(pf, content, 'utf8')
      } catch {}
    }
    throw e
  }
}

function main() {
  const args = process.argv.slice(2)
  const refFlag = args.indexOf('--ref')
  const explicitRef = refFlag === -1 ? null : args[refFlag + 1] || null
  const queryOnly = args.includes('--next')

  const local = readLocal()
  const base = authorityBase(explicitRef)

  if (!base) {
    console.error(
      `⚠️  Keine Basis lesbar (${BASE_REF}, ${FALLBACK_REF}) — der Zähler nutzt lokal ${local}. Vor dem Push gegenprüfen.`,
    )
  } else if (base.version !== local) {
    console.error(
      `🦊 Basis ${base.ref} steht auf ${base.version}, lokal ${local} — der Zähler nutzt die Basis, nicht die Datei.`,
    )
  }

  const next = fmt(bump(parse(base ? base.version : local)))

  if (base && usedVersions(base.ref).has(next)) {
    throw new Error(
      `${next} steht in ${base.ref} bereits. Auf ${BASE_REF} rebasen und den Bump neu rechnen, sonst vergibt main dieselbe Nummer zweimal.`,
    )
  }

  if (queryOnly) {
    console.log(next)
    return
  }
  write(next, local)
}

try {
  main()
} catch (e) {
  console.error(`💥 bump-version Fail — ${e.message}`)
  process.exit(1)
}
