import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  classify,
  MAIN_PUSH,
  PROMOTE_BLOCKED,
  renderIssue,
} from '../../watchdog-classify.mjs'

/**
 * Der Watchdog meldet genau zwei Arten von Vorfall, und die Abgrenzung ist der
 * Auftrag dieses Tests: der rothe Push-Lauf auf `main` und der am `promote`
 * gescheiterte Pull-Request-Lauf. Alles andere ist kein Vorfall.
 *
 * Die Gegenproben sind der eigentliche Inhalt. Vor dem Promote-Verbot lag die
 * Grenze an einem `branches: [main]`-Filter, und die hat einen Fehler klasse
 * verschluckt: sechs rote Läufe, sechs `MERGED`-Pull-Requests, kein Issue. Jetzt
 * entscheidet Code, und die Frage „meldet der Watchdog einen roten Gate-Lauf?"
 * muss mit `false` beantwortet werden, sonst meldet der Watchdog jeden
 * Fehlversuch eines Entwicklers und ist selbst das Rauschen.
 */

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
)
const SCRIPT = path.join(ROOT, 'scripts/watchdog-classify.mjs')
const SHA = 'fa1557baec3fdcb6a3ed8580005135cc4fc372d4'

/** Ein Lauf aus der Actions-API, überschrieben wie es der Test braucht. */
function lauf(overrides = {}) {
  return {
    event: 'push',
    head_branch: 'main',
    head_sha: SHA,
    conclusion: 'failure',
    html_url: 'https://github.com/x/y/actions/runs/1',
    repository: { full_name: 'x/y' },
    ...overrides,
  }
}

/** Die Job-Liste, wie die Actions-API sie für einen Lauf liefert. */
/**
 * @param {[string, string][]} liste
 * @returns {{ name: string, conclusion: string }[]}
 */
function jobs(...liste) {
  return liste.map(([name, conclusion]) => ({ name, conclusion }))
}

/**
 * Issue-Text auf eine Zeile. Die Fließtexte sind im Quelltext umbruchfrei
 * geschrieben, damit sie im Markdown nicht mitten im Satz umbrechen; die
 * Zusicherung prüft deshalb gegen die zusammengezogene Fassung und ist damit
 * unabhängig davon, wo der Quelltext umbricht.
 */
/**
 * @param {string} text
 * @returns {string}
 */
function flatten(text) {
  return text.replace(/\s+/g, ' ')
}

const GATE_GRUEN_PROMOTE_ROT = jobs(
  ['Shinon Gate', 'success'],
  ['Promote nach main', 'failure'],
)
const GATE_ROT_PROMOTE_UEBERSPRUNGEN = jobs(
  ['Shinon Gate', 'failure'],
  ['Promote nach main', 'skipped'],
)

describe('Der Watchdog meldet Vorfälle, nicht Fehlversuche', () => {
  it('meldet einen roten Push-Lauf auf main', () => {
    const decision = classify(lauf())
    expect(decision.report).toBe(true)
    expect(decision.kind).toBe(MAIN_PUSH)
  })

  it('meldet einen Pull-Request-Lauf, dessen promote gescheitert ist', () => {
    const decision = classify(
      lauf({ event: 'pull_request', head_branch: 'fix/promote-token' }),
      GATE_GRUEN_PROMOTE_ROT,
    )
    expect(decision.report).toBe(true)
    expect(decision.kind).toBe(PROMOTE_BLOCKED)
    // Der Grund muss den Unterschied benennen, sonst liest der Issue wie ein
    // gewöhnlicher roter Lauf und wird nicht bearbeitet.
    expect(decision.reason).toContain('promote')
  })

  it('schweigt, wenn das Gate rot ist und promote übersprungen wurde', () => {
    const decision = classify(
      lauf({ event: 'pull_request', head_branch: 'fix/gate-rot' }),
      GATE_ROT_PROMOTE_UEBERSPRUNGEN,
    )
    expect(decision.report).toBe(false)
  })

  it('schweigt bei einem roten Push auf einem Feature-Branch', () => {
    expect(classify(lauf({ head_branch: 'fix/etwas' })).report).toBe(false)
  })

  it('schweigt bei grünem Lauf und bei einem Ereignis, das es nicht kennt', () => {
    expect(classify(lauf({ conclusion: 'success' })).report).toBe(false)
    expect(classify(lauf({ event: 'schedule' })).report).toBe(false)
  })

  it('gibt jedem Vorfall sein eigenes Label und den Kurzsha im Titel', () => {
    const pushLauf = lauf()
    const prLauf = lauf({ event: 'pull_request', head_branch: 'fix/x' })
    const push = renderIssue(pushLauf, classify(pushLauf))
    const blocked = renderIssue(
      prLauf,
      classify(prLauf, GATE_GRUEN_PROMOTE_ROT),
    )
    expect(push.label).toBe('watchdog')
    expect(blocked.label).toBe('promote-blocked')
    for (const issue of [push, blocked]) {
      expect(issue.title).toContain(SHA.slice(0, 7))
      expect(issue.body).toContain('https://github.com/x/y/actions/runs/1')
      expect(issue.body).toContain('x/y')
    }
  })

  it('sagt je Art präzise, was der Commit getroffen hat', () => {
    // Die Schlagzeile erscheint als Fehlerannotation im Lauf. „Je nach Art"
    // wäre eine Ausflucht und würde die Aussage des Klassifizierers im
    // Workflow wiederholen — genau die zweite Wahrheit, die es hier nicht gibt.
    const pushLauf = lauf()
    const prLauf = lauf({ event: 'pull_request', head_branch: 'fix/x' })
    const push = renderIssue(pushLauf, classify(pushLauf)).headline
    const blocked = renderIssue(
      prLauf,
      classify(prLauf, GATE_GRUEN_PROMOTE_ROT),
    ).headline
    expect(push).toContain('liegt bereits auf main')
    expect(blocked).toContain('nicht gelandet')
  })

  it('erfindet für einen Nicht-Vorfall keinen Issue-Text', () => {
    // Gegenprobe zur Reihenfolge im Code: `renderIssue` darf aus einem
    // Nicht-Vorfall keinen Text bauen, sonst meldet der Watchdog irgendwann
    // das Gegenteil dessen, was der Klassifizierer entschieden hat.
    const laufObj = lauf({ event: 'pull_request', head_branch: 'fix/x' })
    const decision = classify(laufObj, GATE_ROT_PROMOTE_UEBERSPRUNGEN)
    expect(decision.report).toBe(false)
    expect(() => renderIssue(laufObj, decision)).toThrow(/kind=/)
  })

  it('nennt im Promote-Text das Secret, den Fehler und den Re-run-Weg', () => {
    const laufObj = lauf({ event: 'pull_request', head_branch: 'fix/x' })
    const body = flatten(
      renderIssue(laufObj, classify(laufObj, GATE_GRUEN_PROMOTE_ROT)).body,
    )
    expect(body).toContain('PROMOTE_TOKEN')
    expect(body).toContain('Re-run failed jobs')
    // Der Satz, der den eigentlichen Unterschied macht: nichts ist gelandet.
    expect(body).toContain('**nicht** gelandet')
  })

  it('behält den fail-open-Hinweis im Push-Text bei', () => {
    const body = flatten(renderIssue(lauf(), classify(lauf())).body)
    expect(body).toContain('fail-open')
    expect(body).toContain('commit-integrity')
  })
})

describe('Der Watchdog schreibt seinen Befund als Dateien', () => {
  /** Fährt das Skript wirklich, statt seine Exporte aufzurufen. */
  /**
   * @param {import('../../watchdog-classify.mjs').WorkflowRun} runObj
   * @param {import('../../watchdog-classify.mjs').WorkflowJob[]} jobListe
   */
  function fahren(runObj, jobListe) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'watchdog-'))
    const out = path.join(dir, 'out')
    fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify(runObj))
    fs.writeFileSync(
      path.join(dir, 'jobs.json'),
      JSON.stringify({ jobs: jobListe }),
    )
    const result = spawnSync(
      process.execPath,
      [
        SCRIPT,
        path.join(dir, 'run.json'),
        path.join(dir, 'jobs.json'),
        '--out',
        out,
      ],
      { encoding: 'utf8' },
    )
    return { result, out, dir }
  }

  it('legt Titel, Label und Body für einen Vorfall ab', () => {
    const { result, out, dir } = fahren(
      lauf({ event: 'pull_request', head_branch: 'fix/x' }),
      GATE_GRUEN_PROMOTE_ROT,
    )
    try {
      expect(result.stderr).toBe('')
      expect(fs.readFileSync(path.join(out, 'report'), 'utf8')).toBe('true')
      expect(fs.readFileSync(path.join(out, 'kind'), 'utf8')).toBe(
        PROMOTE_BLOCKED,
      )
      expect(fs.readFileSync(path.join(out, 'label'), 'utf8')).toBe(
        'promote-blocked',
      )
      expect(fs.readFileSync(path.join(out, 'short'), 'utf8')).toBe(
        SHA.slice(0, 7),
      )
      expect(fs.readFileSync(path.join(out, 'headline'), 'utf8')).toContain(
        'nicht gelandet',
      )
      expect(fs.readFileSync(path.join(out, 'body'), 'utf8')).toContain(
        'PROMOTE_TOKEN',
      )
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('legt ohne Vorfall nur report und Grund ab, keinen Issue-Text', () => {
    const { result, out, dir } = fahren(
      lauf({ event: 'pull_request', head_branch: 'fix/x' }),
      GATE_ROT_PROMOTE_UEBERSPRUNGEN,
    )
    try {
      expect(result.status).toBe(0)
      expect(fs.readFileSync(path.join(out, 'report'), 'utf8')).toBe('false')
      expect(fs.existsSync(path.join(out, 'title'))).toBe(false)
      expect(fs.existsSync(path.join(out, 'body'))).toBe(false)
      // Der Grund ist die Begründung im Log, sonst ist das Schweigen nicht
      // nachvollziehbar.
      expect(fs.readFileSync(path.join(out, 'reason'), 'utf8')).toContain(
        'Gate',
      )
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
