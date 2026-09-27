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
/**
 * @param {string} script
 * @returns {string[]}
 */
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
/**
 * @param {string} command
 * @returns {string}
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
/**
 * @param {string} workflow
 * @returns {string}
 */
function gateJobBlock(workflow) {
  return jobBlock(workflow, 'gate')
}

/** Der Block eines beliebigen Jobs, sauber am nächsten Job abgeschnitten. */
/**
 * @param {string} workflow
 * @param {string} name
 * @returns {string}
 */
function jobBlock(workflow, name) {
  const start = workflow.search(new RegExp(`^ {2}${name}:\\s*$`, 'm'))
  if (start === -1) return ''
  const rest = workflow.slice(start + 1)
  const next = rest.search(/^ {2}[a-z][a-z0-9-]*:\s*$/m)
  return next === -1 ? rest : rest.slice(0, next + 1)
}

/** Die Workflow-Datei als Rohtext. */
function workflowText() {
  return fs.readFileSync(
    path.join(ROOT, '.github/workflows/shinon.yml'),
    'utf8',
  )
}

/**
 * Die `run:`-Befehle des Jobs `gate` aus dem Workflow. Mehrere Befehfe in
 * einem Schritt werden an `&&` getrennt, sonst wäre ein kombinierter Schritt
 * nie wiederzufinden.
 */
function remoteGateCommands() {
  const workflow = workflowText()
  const commands = []
  for (const line of gateJobBlock(workflow).split('\n')) {
    const match = line.match(/^\s+run:\s+(.+)$/)
    if (!match) continue
    const befehl = match[1].trim()
    // Die Blockform (`run: |`) kann diese Funktion nicht zerlegen, sie liest
    // Einzelzeilen. Sie mitzunehmen hiesse, ein Schein-Kommando `|` zu
    // vergleichen — das faellt beim naechsten Block-Schritt auf, nicht vorher.
    if (befehl === '|' || befehl === '>') continue
    for (const part of befehl.split('&&')) {
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

/**
 * @param {string} name
 * @returns {string}
 */
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
/**
 * @param {string} scriptName
 * @param {Set<string>} [seen]
 * @returns {Set<string>}
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
    const runners = [...workflowText().matchAll(/runs-on:\s*(\S+)/g)].map(
      (m) => m[1],
    )
    expect(runners.length).toBeGreaterThan(0)
    for (const runner of runners) {
      expect(runner).toMatch(/^(ubuntu|windows|macos)-latest$/)
    }
  })
})

/**
 * Der push-Zweig auf `main` ist nur lebendig, wenn `promote` nicht mit dem
 * mitgelieferten `GITHUB_TOKEN` schiebt.
 *
 * GitHub startet für Events, die ein `GITHUB_TOKEN` ausgelöst hat, bewusst
 * keinen neuen Workflow-Lauf. Schiebt `promote` damit nach `main`, landen die
 * Commits zwar, aber der push-Zweig startet nie: kein `Commit integrity` auf
 * `main`, kein `client-dist`, und kein Gate wird rot. Der Fehler ist vollkommen
 * still — genau deshalb gehört er in einen Test und nicht in einen Kommentar.
 */
describe('Der push-Zweig auf main bleibt wirklich an', () => {
  it('schiebt nach main mit PROMOTE_TOKEN statt mit GITHUB_TOKEN', () => {
    const promote = jobBlock(workflowText(), 'promote')
    expect(promote).toContain('secrets.PROMOTE_TOKEN')
    expect(promote).not.toMatch(/secrets\.GITHUB_TOKEN/)
    expect(promote).toContain('persist-credentials: false')
  })

  it('lässt dem promote-Job kein Schreiben über den GITHUB_TOKEN', () => {
    expect(jobBlock(workflowText(), 'promote')).not.toContain('contents: write')
  })

  it('promovet keinen Entwurf nach main', () => {
    // `pull_request` feuert auch für Entwürfe. Ohne diese Bedingung wäre ein
    // Entwurf mit grünem Gate ein stiller Merge nach main — der Push-Zweig
    // von 2026-09-26 war nicht das einzige stille Versagen dieser Kette.
    const promote = jobBlock(workflowText(), 'promote')
    expect(promote).toContain('github.event.pull_request.draft == false')
  })

  it('koppelt den push-Trigger an das Deploy-Artefakt auf main', () => {
    const gate = gateJobBlock(workflowText())
    expect(workflowText()).toMatch(/^ {2}push:\s*$/m)
    expect(gate).toContain('actions/upload-artifact@v4')
    // Das Artefakt darf nur im push-Zweig entstehen, sonst wäre es der Baum
    // eines Pull Requests und nicht der von main.
    const step = gate.slice(gate.search(/- name: Deploy-Artefakt/))
    expect(step.slice(0, 300)).toContain("github.event_name == 'push'")
  })
})
