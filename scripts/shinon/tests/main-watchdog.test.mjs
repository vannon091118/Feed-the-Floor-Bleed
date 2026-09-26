import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Der Main-Watchdog beobachtet die roten Push-Läufe auf `main`.
 *
 * Branch-Protection prüft einen SHA, keinen Zustand, und die Pflichtprüfung für
 * einen Push muss vor dem Push existieren. Der Push-Zweig des Shinon-Workflows
 * kann deshalb nichts verhindern, nur melden — am 2026-09-25 um 23:13Z lag so
 * ein roter Lauf 21 Stunden unbeachtet auf `main`. Dieser Test stellt sicher,
 * dass der Watchdog nicht stillschweigend eingestellt wird: Ein toter Watchdog
 * wäre derselbe Fehler wie ein toter `push`-Trigger, nur eine Ebene höher.
 */

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
)
const FILE = path.join(ROOT, '.github/workflows/main-watchdog.yml')

function watchdog() {
  return fs.readFileSync(FILE, 'utf8')
}

describe('Der Main-Watchdog beobachtet rote Push-Läufe auf main', () => {
  it('existiert überhaupt', () => {
    expect(fs.existsSync(FILE)).toBe(true)
  })

  it('hängt sich an den Shinon-Workflow, nicht an einen eigenen Trigger', () => {
    const wf = watchdog()
    expect(wf).toMatch(/^ {2}workflow_run:\s*$/m)
    expect(wf).toMatch(/workflows:\s*\[Shinon\]/)
    expect(wf).toMatch(/types:\s*\[completed\]/)
    // Ohne diesen Filter meldet der Watchdog auch rote PR-Läufe. Die sind
    // normal und werden durch `needs: gate` ohnehin verhindert.
    expect(wf).toMatch(/branches:\s*\[main\]/)
  })

  it('schweigt bei grünem Lauf und wird bei rotem rot', () => {
    const wf = watchdog()
    expect(wf).toContain("github.event.workflow_run.conclusion != 'success'")
    // Der Job muss den Lauf auch selbst noch sichtbar rot machen, sonst bleibt
    // der Vorfall nur ein Issue und verschwindet aus der Lauf-Liste.
    expect(wf).toMatch(/exit 1/)
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
