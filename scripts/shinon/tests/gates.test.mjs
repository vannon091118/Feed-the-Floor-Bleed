import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
)
const FIXTURES = path.join(ROOT, 'scripts/shinon/tests/fixtures')
const temporaryRoots = []

afterEach(() => {
  for (const root of temporaryRoots.splice(0))
    fs.rmSync(root, { recursive: true, force: true })
})

function makeRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'shinon-gate-'))
  temporaryRoots.push(root)
  return root
}

function copyFixture(root, fixture, target) {
  const destination = path.join(root, target)
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.copyFileSync(path.join(FIXTURES, fixture), destination)
}

function runGate(name, root, env = {}) {
  const result = spawnSync(
    'node',
    [path.join(ROOT, `scripts/shinon/plugins/${name}.mjs`), '--changed', ''],
    {
      cwd: root,
      encoding: 'utf8',
      timeout: 60_000,
      env: { ...process.env, ...env },
    },
  )
  return {
    status: result.status,
    output: `${result.stdout || ''}\n${result.stderr || ''}`,
  }
}

describe('Shinon Governance-Gates', () => {
  it('blockiert eine Datei über dem globalen LOC-Cap', () => {
    const root = makeRoot()
    copyFixture(
      root,
      'global-loc-over-limit.ts.fixture',
      'packages/demo/src/large.ts',
    )
    const result = runGate('global-loc-gate', root)
    expect(result.status).toBe(1)
    expect(result.output).toContain('large.ts: 201 > 200 LOC')
  })

  it('blockiert ungültige Contracts', () => {
    const root = makeRoot()
    copyFixture(
      root,
      'contract-package.json.fixture',
      'packages/contracts/package.json',
    )
    copyFixture(
      root,
      'contract-index.ts.fixture',
      'packages/contracts/src/index.ts',
    )
    copyFixture(
      root,
      'contract-invalid.ts.fixture',
      'packages/contracts/src/invalid.ts',
    )
    const result = runGate('schema-contract', root)
    expect(result.status).toBe(1)
    expect(result.output).toContain('Contract-Import node:fs')
    expect(result.output).toContain('sim_version fehlt')
  })

  it('blockiert verbotene Domain-Imports und Zyklen trotz mehrerer Dateien pro Domain', () => {
    const root = makeRoot()
    copyFixture(
      root,
      'modularity-client.ts.fixture',
      'packages/client/src/a.ts',
    )
    copyFixture(
      root,
      'modularity-client-empty.ts.fixture',
      'packages/client/src/b.ts',
    )
    copyFixture(
      root,
      'modularity-server.ts.fixture',
      'packages/server/src/index.ts',
    )
    const result = runGate('modularity-gate', root)
    expect(result.status).toBe(1)
    expect(result.output).toContain('verletzt client-Grenze')
    expect(result.output).toContain('Import-Zyklus')
  })

  it('verhindert Abhängigkeiten von sim-core zu Client oder Server', () => {
    const root = makeRoot()
    copyFixture(
      root,
      'modularity-sim-core.ts.fixture',
      'packages/sim-core/src/index.ts',
    )
    const result = runGate('modularity-gate', root)
    expect(result.status).toBe(1)
    expect(result.output).toContain('verletzt sim-core-Grenze zu client')
    expect(result.output).toContain('verletzt sim-core-Grenze zu server')
  })

  it('erlaubt die definierten Contracts-, Sim-Core-, Client- und Server-Abhängigkeiten', () => {
    const root = makeRoot()
    copyFixture(
      root,
      'positive-contracts.ts.fixture',
      'packages/contracts/src/index.ts',
    )
    copyFixture(
      root,
      'positive-sim-core.ts.fixture',
      'packages/sim-core/src/index.ts',
    )
    copyFixture(
      root,
      'positive-client.ts.fixture',
      'packages/client/src/index.ts',
    )
    copyFixture(
      root,
      'positive-server.ts.fixture',
      'packages/server/src/index.ts',
    )
    const result = runGate('modularity-gate', root)
    expect(result.status).toBe(0)
    expect(result.output).toContain(
      'keine verbotenen Domain-Grenzen oder Zyklen',
    )
  })

  it('blockiert echten Dead Code im negativen Fixture', () => {
    const root = makeRoot()
    copyFixture(root, 'dead-code.ts.fixture', 'packages/demo/src/dead.ts')
    copyFixture(root, 'tsc-pass.mjs.fixture', 'fake-tsc.mjs')
    const result = runGate('dead-code-gate', root, {
      SHINON_TSC: path.join(root, 'fake-tsc.mjs'),
    })
    expect(result.status).toBe(1)
    expect(result.output).toContain('debugger ist blockierender Dead-Code')
  })

  it('blockiert duplizierte Sechszeilen-Blöcke', () => {
    const root = makeRoot()
    copyFixture(root, 'redundancy-a.ts.fixture', 'packages/a/src/one.ts')
    copyFixture(root, 'redundancy-b.ts.fixture', 'packages/b/src/two.ts')
    const result = runGate('redundancy-gate', root)
    expect(result.status).toBe(1)
    expect(result.output).toContain('identische Codezeilen')
  })
})
