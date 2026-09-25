import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { POLICY } from '../policy.mjs'

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
)
const ENGINE = path.join(ROOT, 'scripts/shinon/engine.mjs')
const PLUGIN_NAMES = fs
  .readdirSync(path.join(ROOT, 'scripts/shinon/plugins'))
  .filter((file) => file.endsWith('.mjs'))
  .map((file) => path.basename(file, '.mjs'))
const temporaryRoots = []

afterEach(() => {
  for (const root of temporaryRoots.splice(0))
    fs.rmSync(root, { recursive: true, force: true })
})

function makeRepo(changedFiles) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'shinon-engine-'))
  temporaryRoots.push(root)
  const pluginDir = path.join(root, 'scripts/shinon/plugins')
  fs.mkdirSync(pluginDir, { recursive: true })
  for (const name of PLUGIN_NAMES) {
    fs.writeFileSync(
      path.join(pluginDir, `${name}.mjs`),
      `console.log('PLUGIN_RAN_${name}')\n`,
    )
  }
  for (const changedFile of changedFiles) {
    const changed = path.join(root, changedFile)
    fs.mkdirSync(path.dirname(changed), { recursive: true })
    fs.writeFileSync(changed, 'export const fixture = true\n')
  }
  execFileSync('git', ['init', '-q'], { cwd: root })
  execFileSync('git', ['add', '.'], { cwd: root })
  return root
}

describe('engine smoke test', () => {
  it('executes the policy-selected gates through a real engine run', () => {
    const result = spawnSync(process.execPath, [ENGINE], {
      cwd: makeRepo([
        'docs/change.md',
        'packages/sim-core/src/math/index.ts',
        'packages/sim-core/src/combat/index.ts',
      ]),
      encoding: 'utf8',
      timeout: 30_000,
    })
    expect(result.status).toBe(0)
    for (const name of POLICY.engine.always)
      expect(result.stdout).toContain(`PLUGIN_RAN_${name}`)
    expect(result.stdout).toContain('PLUGIN_RAN_core-determinism')
    expect(result.stdout).toContain('PLUGIN_RAN_false-positive')
  })
})
