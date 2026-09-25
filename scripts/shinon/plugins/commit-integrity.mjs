#!/usr/bin/env node
/**
 * commit-integrity Plugin — Remote-Ersatz für den umgehbaren commit-msg Hook.
 * Der lokale Hook schützt nur den Entwicklerrechner. Wer --no-verify nutzt,
 * klont, --ignore-scripts installiert oder core.hooksPath leert, umgeht ihn.
 * Dieses Plugin prüft die tatsächlichen Commits der Range und läuft in CI.
 */
import { execSync } from 'node:child_process'
import { checkMessage } from '../lib/commit-text.mjs'

const ROOT = process.cwd()
const SEP = '\u001e'
const REC = '\u001d'

function run(cmd) {
  return execSync(cmd, {
    encoding: 'utf8',
    cwd: ROOT,
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

/**
 * Inhalts-Commits der Range, ausdrücklich ohne Merge-Commits.
 *
 * Ein Merge-Commit trägt keinen eigenen Inhalt, sondern nur die Vereinigung
 * seiner Eltern. GitHub erzeugt für jeden Pull Request zusätzlich einen
 * synthetischen Test-Merge (refs/pull/N/merge), der niemals einen Body hat
 * und ein reines Body-Gate fälschlich rot machen würde. Geprüft werden deshalb
 * die Inhalts-Commits; der Merge selbst steht über seine Eltern im Bereich.
 */
function commitsBetween(from, to) {
  const range = from ? `${from}..${to}` : to
  const fmt = ['%H', '%B'].join(REC) + SEP
  const out = run(`git log --no-merges --format="${fmt}" ${range}`)
  return out
    .split(SEP)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((chunk) => {
      const i = chunk.indexOf(REC)
      return { sha: chunk.slice(0, i), message: chunk.slice(i + 1) }
    })
}

function filesOf(sha) {
  const out = run(`git show --name-only --format="" ${sha}`)
  return out
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((f) => !f.startsWith(REC))
}

function mergeCount(from, to) {
  const range = from ? `${from}..${to}` : to
  try {
    return run(`git log --merges --oneline ${range}`)
      .split('\n')
      .filter(Boolean).length
  } catch {
    return 0
  }
}

function resolveRange() {
  const args = process.argv.slice(2)
  const idx = args.indexOf('--from')
  const explicit = idx !== -1 ? args[idx + 1] : null
  if (idx !== -1 && !explicit) {
    die(
      '--from wurde ohne Wert übergeben. Das ist ein Aufruffehler, kein gültiger Bereich.',
    )
  }
  if (explicit) {
    try {
      run(`git rev-parse --verify ${explicit}^{commit}`)
    } catch {
      die(
        `Referenz "${explicit}" ist nicht auflösbar. Bereich nicht prüfbar, Gate darf nicht grün werden.`,
      )
    }
    return { from: explicit, to: 'HEAD' }
  }
  try {
    return {
      from: run('git rev-parse --verify origin/main').trim(),
      to: 'HEAD',
    }
  } catch {
    die(
      'origin/main ist nicht auflösbar. In CI --from übergeben oder fetch-depth 0 setzen.',
    )
  }
}

function die(msg) {
  console.error(`💥 commit-integrity — ${msg}`)
  process.exit(1)
}

const { from, to } = resolveRange()
let commits
try {
  commits = commitsBetween(from, to)
} catch {
  die(
    `Die Range ${from ?? '(leer)'}..${to} ließ sich nicht lesen. Gate darf nicht grün werden.`,
  )
}

const failures = []
for (const c of commits) {
  const res = checkMessage(c.message, filesOf(c.sha))
  if (!res.ok) {
    const short = c.sha.slice(0, 8)
    failures.push({ short, violations: res.violations })
  }
}

if (failures.length > 0) {
  console.error(
    `💥 commit-integrity — ${failures.length} von ${commits.length} Commits verletzen die Commit-Regeln:`,
  )
  for (const f of failures) {
    console.error(`   ${f.short}:`)
    for (const v of f.violations) console.error(`      - ${v}`)
  }
  console.error(
    '   Der lokale commit-msg Hook ist umgehbar, diese Prüfung nicht.',
  )
  process.exit(1)
}

console.log(
  `✅ commit-integrity ok — ${commits.length} Inhalts-Commits geprüft${from ? ` (${from.slice(0, 8)}..${to})` : ''}, ${mergeCount(from, to)} Merge-Commits übersprungen.`,
)
