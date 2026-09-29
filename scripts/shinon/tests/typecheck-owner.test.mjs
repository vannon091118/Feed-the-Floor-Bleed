import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Der Typecheck hat genau einen Owner.
 *
 * Gemessen am 2026-09-29 lief derselbe Compilerlauf viermal: einmal als
 * eigener Schritt von `gate`, einmal in `check`, einmal im Plugin
 * `dead-code-gate` und einmal im `pre-push`-Hook, der die Plugin-Suite
 * erneut fährt. Der Remote-Lauf hatte dieselbe Doppelung. Ein zweiter Lauf
 * derselben Prüfung ist keine zweite Sicherheit, sondern nur Wartezeit, und
 * zwei Aufrufstellen mit zwei Regelsätzen sind ein Fehler, der grün bleibt.
 *
 * Der Vertrag ist deshalb: `tsconfig.json` trägt die Regeln, das Plugin
 * `dead-code-gate` ist die einzige Stelle, die den Compiler startet, und
 * `check` ist der einzige Einstieg, über den `gate` und der Remote-Job ihn
 * erreichen. `pnpm run -s typecheck` bleibt der Einzelbefehl mit demselben
 * Programm.
 */

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
)

/** @param {string} relative @returns {string} */
function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8')
}

/** @param {string} name @returns {string} */
function script(name) {
  const pkg = JSON.parse(read('package.json'))
  return pkg.scripts[name]
}

/**
 * Die Kommandos einer `&&`-Kette, Aliasse eine Ebene tief aufgelöst.
 * @param {string} name
 * @param {Set<string>} [seen]
 * @returns {string[]}
 */
function chain(name, seen = new Set()) {
  if (seen.has(name)) return []
  const next = new Set(seen).add(name)
  const out = []
  for (const part of script(name).split('&&')) {
    const cmd = part.trim()
    if (!cmd) continue
    out.push(cmd)
    const nested = /^pnpm run -s ([\w:-]+)$/.exec(cmd)
    if (nested) out.push(...chain(nested[1], next))
  }
  return out
}

/** Alle Plugin-Quellen, die den Compiler starten. */
function compilerCallers() {
  const dir = path.join(ROOT, 'scripts/shinon/plugins')
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.mjs'))
    .filter((file) =>
      /'typescript',\s*'bin',\s*'tsc'/.test(
        fs.readFileSync(path.join(dir, file), 'utf8'),
      ),
    )
}

/** Der Block eines Jobs aus dem Workflow, am nächsten Job abgeschnitten. */
/** @param {string} workflow @param {string} name @returns {string} */
function jobBlock(workflow, name) {
  const start = workflow.search(new RegExp(`^ {2}${name}:\\s*$`, 'm'))
  if (start === -1) return ''
  const rest = workflow.slice(start + 1)
  const next = rest.search(/^ {2}[a-z][a-z0-9-]*:\s*$/m)
  return next === -1 ? rest : rest.slice(0, next + 1)
}

describe('Der Typecheck läuft genau einmal', () => {
  it('startet den Compiler in keiner Kette, die den Typecheck umgeht', () => {
    // `gate` und `gate:quick` dürfen den Compiler nur mittelbar über `check`
    // erreichen; stünde er dort zusätzlich, liefe er zweimal pro Lauf.
    for (const name of ['gate', 'gate:quick']) {
      const direct = chain(name).filter((cmd) => /typecheck|\btsc\b/.test(cmd))
      expect(
        direct,
        `${name} fährt den Compiler zusätzlich: ${direct}`,
      ).toEqual([])
    }
    expect(chain('gate')).toContain('node scripts/shinon/engine.mjs --full')
  })

  it('lässt genau ein Plugin den Compiler fahren', () => {
    expect(compilerCallers()).toEqual(['dead-code-gate.mjs'])
  })

  it('trägt die NoUnused-Regeln im tsconfig statt auf einer Kommandozeile', () => {
    const tsconfig = read('tsconfig.json')
    expect(tsconfig).toMatch(/"noUnusedLocals":\s*true/)
    expect(tsconfig).toMatch(/"noUnusedParameters":\s*true/)
    // Ein Aufrufer mit eigenem Flagsatz wäre ein zweiter Regelsatz: die
    // Engine würde strenger prüfen als der Einzelbefehl, ohne dass es auffällt.
    expect(read('scripts/shinon/plugins/dead-code-gate.mjs')).not.toContain(
      '--noUnusedLocals',
    )
    expect(script('typecheck')).toBe('tsc --noEmit')
  })

  it('fährt ihn auf dem Commit-Pfad über die Plugin-Suite', () => {
    // Ohne Eintrag in `always` würde der Compiler an Commit und Push fehlen,
    // weil dort nur die Engine läuft und nicht `pnpm run -s check`.
    const policy = JSON.parse(read('scripts/shinon/policy.json'))
    expect(policy.engine.always).toContain('dead-code-gate')
    expect(read('.husky/pre-push')).toContain('engine.mjs --full')
  })

  it('wiederholt ihn im Remote-Gate-Job nicht als eigenen Schritt', () => {
    const workflow = read('.github/workflows/shinon.yml')
    expect(jobBlock(workflow, 'gate')).not.toContain('pnpm run -s typecheck')
    // Der Windows-Job ist ein Signal und fährt `check` nicht; dort bleibt der
    // eigene Schritt, sonst hätte dieses Signal gar keinen Typecheck.
    expect(jobBlock(workflow, 'gate-windows')).toContain(
      'pnpm run -s typecheck',
    )
  })
})
