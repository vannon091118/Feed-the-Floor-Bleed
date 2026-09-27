import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * `main` hat genau einen Schreiber: den Job `promote` nach einem grünen Gate.
 *
 * Branch-Protection prüft einen Status-Check auf einem SHA, nicht den Weg
 * dorthin, und `strict` wirkt nur auf Merges. Am 2026-09-26 lag `fa1557b` mit
 * grünem `Shinon Gate` auf `main`, obwohl der PR-Lauf am Promote-Job rot war:
 * Der Auto-Push im `post-commit` hatte den PR-Kopf geschoben, und die
 * Protection hatte keinen Grund, das abzulehnen. `docs/REGELWERK_GIT.md` nannte
 * `strict` und `enforce_admins` als Beleg für die Unmöglichkeit — dieser Beleg
 * war falsch. Die Sperre sitzt deshalb im Hook, und der Hook gehört dem
 * Generator, nicht sich selbst.
 */

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
)
const HOOK = path.join(ROOT, '.husky/pre-push')
const OWNER = path.join(ROOT, 'scripts/shinon/install-hooks.mjs')
const MAIN = 'refs/heads/fix/x 1111111 refs/heads/main 2222222\n'
const BRANCH = 'refs/heads/fix/x 1111111 refs/heads/fix/x 2222222\n'

/**
 * Fährt den echten Hook in einem leeren Verzeichnis. Der Generator läuft
 * danach absichtlich ins Leere, weil `engine.mjs` dort nicht existiert — geprüft
 * wird die Sperre, nicht die Suite, und der Abbruch danach ist billiger als ein
 * voller Gate-Lauf in jedem Test.
 */
/**
 * @param {string} spec
 * @param {Record<string, string>} [env]
 * @returns {import('node:child_process').SpawnSyncReturns<string>}
 */
function runHook(spec, env = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shinon-pre-push-'))
  try {
    return spawnSync('sh', [HOOK], {
      cwd: dir,
      encoding: 'utf8',
      input: spec,
      env: { ...process.env, SHINON_MAIN_BRANCH: 'main', ...env },
    })
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

describe('Nur promote schreibt nach main', () => {
  it('weist einen Push auf main ab, bevor die Suite fährt', () => {
    const run = runHook(MAIN)
    expect(run.error).toBeUndefined()
    expect(run.status).not.toBe(0)
    expect(run.stdout).toContain('verweigert')
    // Die Sperre muss vor der Suite stehen, sonst wäre der Push nur langsamer.
    expect(run.stdout).not.toContain('Full Test-Suite')
  })

  it('lässt einen Feature-Branch durch', () => {
    const run = runHook(BRANCH)
    expect(run.error).toBeUndefined()
    expect(run.stdout).not.toContain('verweigert')
  })

  it('öffnet den Notfallweg nur ausdrücklich', () => {
    const run = runHook(MAIN, { SHINON_ALLOW_MAIN_PUSH: '1' })
    expect(run.error).toBeUndefined()
    expect(run.stdout).toContain('freigegeben')
    expect(run.stdout).not.toContain('verweigert')
  })

  it('nennt für den Notfallweg den Break-Glass-Befehl', () => {
    expect(fs.readFileSync(HOOK, 'utf8')).toContain('break-glass-main.mjs')
  })

  it('hält die Sperre im Generator fest, nicht nur in der erzeugten Datei', () => {
    // `pnpm prepare` überschreibt `.husky/*` aus `install-hooks.mjs`. Ein Guard,
    // der nur in der erzeugten Datei steht, wäre beim nächsten Install still weg
    // — und der Weg nach main wieder offen, ohne dass ein Fehler sichtbar wird.
    const guard = '[ "$branch" = "$main_branch" ]'
    expect(fs.readFileSync(OWNER, 'utf8')).toContain(guard)
    expect(
      fs.readFileSync(path.join(ROOT, '.husky/post-commit'), 'utf8'),
    ).toContain(guard)
  })
})
