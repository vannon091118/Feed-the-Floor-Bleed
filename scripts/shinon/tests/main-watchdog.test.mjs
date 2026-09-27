import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Der Main-Watchdog macht rote Shinon-Läufe zu sichtbaren Vorfällen.
 *
 * Branch-Protection prüft einen SHA, keinen Zustand, und die Pflichtprüfung für
 * einen Push muss vor dem Push existieren. Der Push-Zweig des Shinon-Workflows
 * kann deshalb nichts verhindern, nur melden — am 2026-09-25 um 23:13Z lag so
 * ein roter Lauf 21 Stunden unbeachtet auf `main`. Dieser Test stellt sicher,
 * dass der Watchdog nicht stillschweigend eingestellt wird: Ein toter Watchdog
 * wäre derselbe Fehler wie ein toter `push`-Trigger, nur eine Ebene höher.
 *
 * Er hält außerdem den zweiten Vorfall fest, den der Watchdog bis zum
 * 2026-09-26 übersehen hat. Der Trigger trug `branches: [main]` und griff damit
 * nur auf Push-Läufe. Sechs rote Läufe auf einem Pull-Request-Branch fielen
 * durch, obwohl dort `promote` gescheitert war und die Commits liegen blieben.
 * Wer den Filter wieder einführt, stellt den Fehler wieder her — deshalb
 * prüft der Test hier ausdrücklich, dass er fehlt.
 */

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
)
const FILE = path.join(ROOT, '.github/workflows/main-watchdog.yml')

function watchdog() {
  return fs.readFileSync(FILE, 'utf8')
}

describe('Der Main-Watchdog macht rote Shinon-Läufe sichtbar', () => {
  it('existiert überhaupt', () => {
    expect(fs.existsSync(FILE)).toBe(true)
  })

  it('hängt sich an den Shinon-Workflow, nicht an einen eigenen Trigger', () => {
    const wf = watchdog()
    expect(wf).toMatch(/^ {2}workflow_run:\s*$/m)
    expect(wf).toMatch(/workflows:\s*\[Shinon\]/)
    expect(wf).toMatch(/types:\s*\[completed\]/)
  })

  it('sieht auch Pull-Request-Läufe und filtert sie nicht am Trigger weg', () => {
    // Gegenprobe zum Befund vom 2026-09-26: `branches: [main]` griff auf den
    // Kopf-Branch des auslösenden Laufs und blendete damit jeden roten
    // Pull-Request-Lauf aus. Die Unterscheidung "Push auf main" gegen "rote
    // Gate-Läufe" ist Sache des Klassifizierers, nicht des Triggers.
    expect(watchdog()).not.toMatch(/^\s{4}branches:/m)
    expect(watchdog()).toContain('scripts/watchdog-classify.mjs')
  })

  it('holt den Klassifizierer aus dem Default-Branch, nicht aus dem Lauf', () => {
    // Sonst könnte ein Pull Request über das Skript bestimmen, was als Vorfall
    // gemeldet wird. Das Werkzeug der Wache darf nicht vom Meldepflichtigen
    // stammen.
    const wf = watchdog()
    expect(wf).toMatch(/actions\/checkout@v4/)
    expect(wf).toMatch(
      /ref: \$\{\{ github\.event\.repository\.default_branch \}\}/,
    )
  })

  it('fragt die Jobs des Laufs ab und darf das auch', () => {
    // Nur mit der Job-Liste lässt sich "Gate grün, promote rot" von "Gate rot"
    // unterscheiden — genau diese Unterscheidung entscheidet, ob gemeldet wird.
    const wf = watchdog()
    expect(wf).toMatch(/actions\/runs\/\$RUN_ID\/jobs/)
    expect(wf).toMatch(/^\s{2}actions: read$/m)
    expect(wf).toMatch(/GH_REPO: \$\{\{ github\.repository \}\}/)
  })

  it('schweigt bei grünem Lauf und wird bei rotem rot', () => {
    const wf = watchdog()
    expect(wf).toContain("github.event.workflow_run.conclusion != 'success'")
    // Der Job muss den Lauf auch selbst noch sichtbar rot machen, sonst bleibt
    // der Vorfall nur ein Issue und verschwindet aus der Lauf-Liste.
    expect(wf).toMatch(/exit 1/)
  })

  it('bleibt bei einem Nicht-Vorfall grün, damit der Watchdog nicht rauscht', () => {
    // Jeder Fehlversuch eines Entwicklers ist ein roter PR-Lauf. Wird der
    // Watchdog dabei rot, ist er bei dem einen echten Vorfall unhörbar.
    const wf = watchdog()
    expect(wf).toContain("report != 'true'")
    expect(wf).toContain('Kein Vorfall')
  })

  it('bleibt auf einem GitHub-Runner ohne Kernzahl', () => {
    const runners = [...watchdog().matchAll(/runs-on:\s*(\S+)/g)].map(
      (m) => m[1],
    )
    expect(runners.length).toBeGreaterThan(0)
    for (const runner of runners) {
      expect(runner).toMatch(/^(ubuntu|windows|macos)-latest$/)
    }
  })
})
