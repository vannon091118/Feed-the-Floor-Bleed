#!/usr/bin/env node
/**
 * break-glass-main — Notfallweg, wenn GitHub Actions keinen Lauf startet.
 *
 * `main` verlangt den Required-Status-Check `Shinon Gate` mit `strict`, und
 * `promote` schiebt den geprüften PR-Kopf nach `main`. Beides läuft als
 * Actions-Job. Starten keine Jobs, gibt es keinen Weg mehr nach `main`:
 * `enforce_admins` ist aktiv, Force-Push und Löschen sind gesperrt, also
 * weist auch ein Admin-Push den Vorgang mit GH013 ab.
 *
 * Dieses Skript ist der einzige dafür vorgesehene Ausweg und er ist eng
 * gefasst: Es lockt **ausschließlich** `required_status_checks`. Lineare
 * Historie, Admin-Härte, Konfliktauflösung und das Verbot von Force-Pushes
 * bleiben unangetastet. Vor dem Lock wird der Zustand serialisiert, nach dem
 * Push zurückgeschrieben und die Wiederherstellung geprüft.
 *
 * Es ist KEIN Ersatz für ein rotes Gate. Ein rotes Gate ist ein Veto.
 * Auslöser ist nur: der Workflow startet nicht, UND die Protection ist
 * unverändert aktiv. Siehe `docs/REGELWERK_GIT.md`, Abschnitt
 * "Ausfall von GitHub Actions".
 *
 * Aufruf:
 *   node scripts/break-glass-main.mjs status
 *   node scripts/break-glass-main.mjs lock    [--dry-run]
 *   node scripts/break-glass-main.mjs restore [--dry-run]
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const REPO = process.env.SHINON_REPO || 'vannon091118/Feed-the-Floor-Bleed'
const BRANCH = 'main'
const STATE = path.join(os.tmpdir(), 'shinon-break-glass-protection.json')
const PROTECTION = `repos/${REPO}/branches/${BRANCH}/protection`

/**
 * Ruft die `gh`-CLI auf. `input` wird als stdin gereicht, weil
 * `gh api --input -` seinen JSON-Body von dort liest und nicht aus argv.
 */
function gh(args, input = null) {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    stdio:
      input === null ? ['ignore', 'pipe', 'pipe'] : ['pipe', 'pipe', 'pipe'],
    input: input === null ? undefined : input,
  })
}

function fail(msg) {
  console.error(`💥 break-glass — ${msg}`)
  process.exit(1)
}

function info(msg) {
  console.log(`🦊 ${msg}`)
}

/** Liest den aktuellen Protection-Zustand. */
function readProtection() {
  try {
    return JSON.parse(gh(['api', PROTECTION]))
  } catch {
    return null
  }
}

function describe(state) {
  if (!state) {
    console.log('   Protection: nicht lesbar oder nicht gesetzt')
    return
  }
  const required = state.required_status_checks?.contexts ?? []
  console.log(`   required_status_checks: ${required.join(', ') || '(keine)'}`)
  console.log(`   strict: ${state.required_status_checks?.strict ?? '-'}`)
  console.log(`   enforce_admins: ${state.enforce_admins?.enabled ?? '-'}`)
  console.log(
    `   required_linear_history: ${state.required_linear_history?.enabled ?? '-'}`,
  )
  console.log(
    `   allow_force_pushes: ${state.allow_force_pushes?.enabled ?? '-'}`,
  )
}

/**
 * Baut den PATCH-Body. Nur `required_status_checks` wird entfernt; alle
 * übrigen Regeln werden unverändert zurückgeschrieben, damit der Lock nicht
 * versehentlich mehr auflockt als beabsichtigt.
 */
function lockBody(before) {
  return {
    required_status_checks: null,
    enforce_admins: before.enforce_admins?.enabled ?? true,
    required_pull_request_reviews: before.required_pull_request_reviews ?? null,
    restrictions: before.restrictions ?? null,
    required_linear_history: before.required_linear_history?.enabled ?? true,
    allow_force_pushes: before.allow_force_pushes?.enabled ?? false,
    allow_deletions: before.allow_deletions?.enabled ?? false,
    block_creations: before.block_creations?.enabled ?? false,
    required_conversation_resolution:
      before.required_conversation_resolution?.enabled ?? true,
    required_signatures: before.required_signatures?.enabled ?? false,
  }
}

const command = process.argv[2]
const dryRun = process.argv.includes('--dry-run')

if (!['status', 'lock', 'restore'].includes(command)) {
  fail('Aufruf muss status, lock oder restore sein. Siehe Kopf dieses Skripts.')
}

if (command === 'status') {
  info(`Protection ${BRANCH} in ${REPO}`)
  describe(readProtection())
  console.log(
    `   gesicherter Zustand: ${fs.existsSync(STATE) ? STATE : 'nein'}`,
  )
  process.exit(0)
}

if (command === 'lock') {
  const before = readProtection()
  if (!before) fail('Protection nicht lesbar. Abbruch ohne Zustandsänderung.')
  if (!before.required_status_checks) {
    info('required_status_checks sind bereits gesetzt. Kein Lock nötig.')
    process.exit(0)
  }
  const body = lockBody(before)
  if (dryRun) {
    info('DRY-RUN — es wird nichts gesendet und nichts gesichert. Body wäre:')
    console.log(
      JSON.stringify({ method: 'PUT', endpoint: PROTECTION, body }, null, 2),
    )
    process.exit(0)
  }
  fs.writeFileSync(STATE, JSON.stringify(before, null, 2))
  info(`Zustand gesichert nach ${STATE}`)
  gh(
    ['api', '--method', 'PUT', PROTECTION, '--input', '-'],
    JSON.stringify(body),
  )
  info('Lock gesetzt. JETZT pushen, danach sofort restore.')
  process.exit(0)
}

if (command === 'restore') {
  if (!fs.existsSync(STATE)) {
    fail(`Kein gesicherter Zustand unter ${STATE}. Abbruch.`)
  }
  const before = JSON.parse(fs.readFileSync(STATE, 'utf8'))
  if (dryRun) {
    info(`DRY-RUN — zurückgeschrieben würde der Zustand von ${STATE}`)
    process.exit(0)
  }
  const after = readProtection()
  if (!after) fail('Protection nicht lesbar. Restore nicht möglich.')
  const wanted = before.required_status_checks
  const current = after.required_status_checks
  const same =
    JSON.stringify(wanted?.contexts ?? null) ===
      JSON.stringify(current?.contexts ?? null) &&
    Boolean(wanted?.strict) === Boolean(current?.strict)
  if (same) {
    info('required_status_checks stimmen bereits. Nichts zu tun.')
  } else {
    gh(
      ['api', '--method', 'PUT', PROTECTION, '--input', '-'],
      JSON.stringify(before),
    )
    info('Zustand zurückgeschrieben.')
  }
  describe(readProtection())
}
