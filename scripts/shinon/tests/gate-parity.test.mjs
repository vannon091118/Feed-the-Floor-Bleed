import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Parität zwischen dem Remote-Gate und dem lokalen Gate.
 *
 * Der Workflow-Job `gate` ist die verbindliche Fassung. `pnpm run -s gate`
 * ist ihr lokales Spiegelbild, und dieser Test verhindert, dass die beiden
 * auseinanderlaufen: Wer einen Schritt im Workflow ergänzt und ihn lokal
 * vergisst, bekommt hier rot statt ein grünes lokales Gate, das der Remote
 * nicht kennt.
 */

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
)

/** Zerlegt eine `&&`-Kette in ihre Einzelbefehle. */
function splitChain(script) {
  return script
    .split('&&')
    .map((part) => part.trim())
    .filter(Boolean)
}

/**
 * Bringt einen Befehl auf eine vergleichbare Form. `pnpm run -s test`,
 * `pnpm test -- --run` und `pnpm --filter @floor/client build` beschreiben
 * denselben Lauf, werden aber unterschiedlich getippt.
 */
function canonical(command) {
  let cmd = command.trim()
  cmd = cmd.replace(/^pnpm run -s /, 'pnpm ')
  cmd = cmd.replace(/\s+--\s+--run$/, '')
  cmd = cmd.replace(/\s+--run$/, '')
  if (cmd.startsWith('pnpm --filter ')) {
    const parts = cmd.split(' ')
    cmd = `pnpm ${parts[parts.length - 1]}`
  }
  return cmd
} /** Der Block des Jobs `gate`, sauber am nächsten Job abgeschnitten. */
function gateJobBlock(workflow) {
  const start = workflow.search(/^ {2}gate:\s*$/m)
  if (start === -1) return ''
  const rest = workflow.slice(start + 1)
  const next = rest.search(/^ {2}[a-z][a-z0-9-]*:\s*$/m)
  return next === -1 ? rest : rest.slice(0, next + 1)
}

/**
 * Die `run:`-Befehle des Jobs `gate` aus dem Workflow. Mehrere Befehfe in
 * einem Schritt werden an `&&` getrennt, sonst wäre ein kombinierter Schritt
 * nie wiederzufinden.
 */
function remoteGateCommands() {
  const workflow = fs.readFileSync(
    path.join(ROOT, '.github/workflows/shinon.yml'),
    'utf8',
  )
  const commands = []
  for (const line of gateJobBlock(workflow).split('\n')) {
    const match = line.match(/^\s+run:\s+(.+)$/)
    if (!match) continue
    for (const part of match[1].split('&&')) {
      const cmd = part.trim()
      if (!cmd) continue
      if (cmd.startsWith('pnpm install')) continue
      if (cmd.startsWith('node scripts/shinon/plugins/commit-integrity'))
        continue
      commands.push(canonical(cmd))
    }
  }
  return new Set(commands)
}

function localScript(name) {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'),
  )
  return pkg.scripts[name]
}

/**
 * Löst ein Script transitiv auf. `gate` ruft `check`, und `check` enthält
 * wiederum LOC, Doku-Hygiene und die Shinon-Suite. Ohne Auflösung sähe eine
 * Teilmenge falsch aus, nur weil die Befehle eine Ebene tiefer stehen.
 *
 * Zyklen sind möglich und nicht automatisch ein Fehler: `build` ist
 * `pnpm --filter @floor/client build` und zeigt nach der Normalisierung auf
 * sich selbst. Deshalb werden Scripts pro Pfad nur einmal aufgelöst.
 */
function expand(scriptName, seen = new Set()) {
  if (seen.has(scriptName)) return new Set()
  const next = new Set(seen).add(scriptName)
  const out = new Set()
  for (const part of splitChain(localScript(scriptName))) {
    const cmd = canonical(part)
    const nested = /^pnpm\s+([\w:-]+)$/.exec(cmd)
    if (nested && localScript(nested[1])) {
      // Der Alias bleibt Teil deslaufs, sonst verlöre sich `pnpm typecheck`
      // genau dann, wenn `gate` es tatsächlich aufruft.
      out.add(cmd)
      for (const inner of expand(nested[1], next)) out.add(inner)
      continue
    }
    out.add(cmd)
  }
  return out
}

describe('Parität zwischen Remote-Gate und lokalem Gate', () => {
  it('spiegelt jeden Workflow-Schritt im gate-Script', () => {
    const remote = remoteGateCommands()
    const local = expand('gate')
    for (const cmd of remote) {
      expect(local.has(cmd), `lokal fehlt: ${cmd}`).toBe(true)
    }
  })

  it('hält gate:quick als echte Teilmenge von gate', () => {
    const full = expand('gate')
    const quick = expand('gate:quick')
    expect(quick.size).toBeGreaterThan(0)
    for (const cmd of quick) {
      expect(full.has(cmd), `gate:quick läuft ${cmd}, gate nicht`).toBe(true)
    }
  })

  it('findet das commit-integrity-Plugin, das der Remote aufruft', () => {
    const plugin = path.join(
      ROOT,
      'scripts/shinon/plugins/commit-integrity.mjs',
    )
    expect(fs.existsSync(plugin)).toBe(true)
  })

  it('fährt den Remote-Runner auf ubuntu-latest, nicht auf einem kostenpflichtigen', () => {
    const workflow = fs.readFileSync(
      path.join(ROOT, '.github/workflows/shinon.yml'),
      'utf8',
    )
    const runners = [...workflow.matchAll(/runs-on:\s*(\S+)/g)].map((m) => m[1])
    expect(runners.length).toBeGreaterThan(0)
    for (const runner of runners) {
      expect(runner).toMatch(/^(ubuntu|windows|macos)-latest$/)
    }
  })
})
