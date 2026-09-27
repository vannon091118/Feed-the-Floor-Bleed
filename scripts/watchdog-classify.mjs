#!/usr/bin/env node
/**
 * Einzige Wahrheit darüber, ob ein abgeschlossener Shinon-Lauf ein Vorfall ist.
 *
 * Reine Entscheidung, kein Git-Zugriff und kein I/O im Kern: `classify` bekommt
 * den Lauf und seine Jobs, `renderIssue` liefert daraus Titel, Label und Text.
 * Die Workflow-Datei sammelt nur noch zwei API-Antworten ein und legt das Issue
 * an. Damit steht die Frage „ist das ein Vorfall?" an einer Stelle und wird
 * getestet, statt in einem `if:` zu stecken.
 *
 * Es gibt zwei Arten von Vorfall, und der Unterschied ist der ganze Punkt. Ein
 * roter Push-Lauf auf `main` betrifft einen Commit, der schon gelandet ist. Ein
 * roter `Promote nach main` auf einem Pull Request betrifft einen Commit, der
 * **nicht** gelandet ist: Das Gate war grün, der einzige Schreiberweg hat
 * versagt, und niemand außer demjenigen, der den Lauf öffnet, erfährt davon. Am
 * 2026-09-26 waren sechs solcher Läufe rot, sechs Pull Requests wurden trotzdem
 * als `MERGED` geführt, und kein Watchdog meldete etwas — die Fehlerklasse, die
 * dieser Job schließen soll.
 *
 * Ausdrücklich **kein** Vorfall: ein rotes Gate auf einem Pull Request. Das ist
 * das Gate bei seiner Arbeit, `promote` wird übersprungen, und jeder Fehlversuch
 * würde sonst ein Issue erzeugen. Ebenso wenig ist ein roter Push-Lauf auf einem
 * Feature-Branch ein Vorfall; der gehört in den Pull Request, in dem er
 * entsteht.
 */
import fs from 'node:fs'
import path from 'node:path'

export const MAIN_PUSH = 'main-push'
export const PROMOTE_BLOCKED = 'promote-blocked'
export const NO_INCIDENT = 'none'

/** Der Job, dessen Fehlschlag einen Pull Request blockiert. */
const PROMOTE_JOB = 'Promote nach main'

/**
 * Entscheidet, ob der Lauf gemeldet wird.
 *
 * @param {object} run Lauf-Objekt aus der Actions-API.
 * @param {Array<{name: string, conclusion: string}>} jobs Jobs des Laufs.
 * @returns {{report: boolean, kind: string, reason: string}}
 */
export function classify(run, jobs = []) {
  const { event, head_branch: branch, conclusion } = run

  if (conclusion === 'success') {
    return { report: false, kind: NO_INCIDENT, reason: 'Lauf ist grün' }
  }

  if (event === 'push') {
    if (branch === 'main') {
      return {
        report: true,
        kind: MAIN_PUSH,
        reason: 'Ein Push auf main ist rot gelaufen; der Commit liegt bereits',
      }
    }
    return {
      report: false,
      kind: NO_INCIDENT,
      reason: `Roter Push-Lauf auf dem Feature-Branch ${branch}`,
    }
  }

  if (event === 'pull_request') {
    const promote = jobs.find((job) => job.name === PROMOTE_JOB)
    if (promote?.conclusion === 'failure') {
      return {
        report: true,
        kind: PROMOTE_BLOCKED,
        reason:
          'Das Gate war grün, aber promote ist rot: der Pull Request ist blockiert',
      }
    }
    return {
      report: false,
      kind: NO_INCIDENT,
      reason: promote
        ? `Gate rot, promote ${promote.conclusion}: der Pull Request wartet auf eine Korrektur`
        : 'Roter Lauf ohne promote-Job',
    }
  }

  return {
    report: false,
    kind: NO_INCIDENT,
    reason: `Unerwartetes Ereignis ${event}`,
  }
}

/**
 * Titel, Label und Fließtext für den Vorfall. Beide Texte sind statisch, damit
 * ein Issue nicht von einem fehlgeschlagenen Aufruf abhängt.
 */
export function renderIssue(run, decision) {
  const short = run.head_sha.slice(0, 7)
  const table = [
    '| | |',
    '|---|---|',
    `| Lauf | ${run.html_url} |`,
    `| Commit | \`${run.head_sha}\` |`,
    `| Ergebnis | \`${run.conclusion}\` |`,
    `| Branch | \`${run.head_branch}\` |`,
    `| Repo | \`${run.repository?.full_name ?? ''}\` |`,
  ].join('\n')

  if (decision.kind === MAIN_PUSH) {
    return {
      label: 'watchdog',
      headline:
        'Roter Push-Lauf auf main — der Commit liegt bereits auf main und kann nicht mehr zurückgenommen werden.',
      title: `Roter Push-Lauf auf main: ${short} (${run.conclusion})`,
      body: `Ein Shinon-Push-Lauf auf \`main\` ist rot gelaufen. Der Lauf prüft
\`main\` nach der Landung und konnte den Commit deshalb nicht verhindern.
${table}

Der Push-Pfad ist per Konstruktion fail-open; die Sperre ist der
PR-Gate über \`needs: gate\`. Dieser Issue ist der Nachweis, dass ein
roter Push-Lauf bemerkt wurde. Behebe die Ursache und schliesse den
Issue — nicht einfach schliessen.

Beachte die Schrittliste des Laufs: bricht \`commit-integrity\` ab, sind
Typecheck, Tests, Lint und Build **übersprungen**. Ein roter Lauf hat
dann weniger geprüft als ein grüner.`,
    }
  }

  if (decision.kind === PROMOTE_BLOCKED) {
    return {
      label: 'promote-blocked',
      headline:
        'Promote hat den Pull Request blockiert — das Gate war grün, aber der Commit ist nicht gelandet und bleibt liegen.',
      title: `Promote blockiert den Pull Request: ${short}`,
      body: `Ein Shinon-Lauf auf einem Pull Request ist am Job \`Promote nach main\` rot
gelaufen, obwohl das Gate grün war.
Der Commit ist damit **nicht** gelandet, und seit dem Auto-Push-Verbot gibt es
lokal keinen zweiten Weg nach \`main\`: Der Commit bleibt liegen, bis die Ursache
behoben ist.
${table}

Die häufigste Ursache ist ein fehlendes oder unzureichend berechtigtes
Repository-Secret \`PROMOTE_TOKEN\`. \`Permission to <repo> denied to <account>\`
bedeutet: gültiges Token, falsche Berechtigung. Fehlt das Secret ganz, bricht
der Job mit einer Klartextmeldung ab.
Nach dem Korrigieren genügt \`Re-run failed jobs\` auf diesem Lauf, es braucht
keinen neuen Commit.

Dieser Issue ist der Nachweis, dass der Fehler bemerkt wurde. Behebe die Ursache
und schliesse den Issue — nicht einfach schliessen.`,
    }
  }

  // Kein stiller Text für eine unbekannte Art: Klassifizierer und Renderer
  // müssen übereinstimmen, sonst entstünde für einen Nicht-Vorfall ein
  // Issue-Text, der das Gegenteil behauptet.
  throw new Error(`Kein Vorfall-Text für kind=${decision.kind}`)
}

/** Schreibt den Befund als Dateien, damit mehrzeilige Texte ohne Escaping durchgehen. */
function writeReport(dir, payload) {
  fs.mkdirSync(dir, { recursive: true })
  for (const [key, value] of Object.entries(payload)) {
    fs.writeFileSync(path.join(dir, key), value, 'utf8')
  }
}

function main(argv) {
  const outIndex = argv.indexOf('--out')
  const out = outIndex === -1 ? null : argv[outIndex + 1]
  // Ohne `--out` bleiben alle Argumente Dateinamen; mit `--out` fallen Flag und
  // sein Wert weg. Sonst verschluckt der Filter den ersten Dateinamen.
  const files =
    outIndex === -1
      ? argv
      : argv.filter((_, i) => i !== outIndex && i !== outIndex + 1)
  const [runFile, jobsFile] = files

  const run = JSON.parse(fs.readFileSync(runFile, 'utf8'))
  const jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8')).jobs ?? []
  const decision = classify(run, jobs)
  const issue = decision.report ? renderIssue(run, decision) : null
  const payload = {
    report: String(decision.report),
    kind: decision.kind,
    reason: decision.reason,
    // Der Kurzsha steht im Titel und dient als Dedupe-Schlüssel für den
    // Workflow: Ein offener Vorfall zum selben Commit wird nachgetragen statt
    // ein zweiter angelegt.
    short: run.head_sha.slice(0, 7),
    ...(issue ?? {}),
  }

  if (out) {
    writeReport(out, payload)
    return
  }
  for (const [key, value] of Object.entries(payload))
    console.log(`${key}=${value}`)
}

if (process.argv[1]?.endsWith('watchdog-classify.mjs')) {
  main(process.argv.slice(2))
}
