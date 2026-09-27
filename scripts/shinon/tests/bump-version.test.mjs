import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

/**
 * Der Next-Bump-Zähler in `scripts/bump-version.mjs`.
 *
 * Die alte Fassung zählte aus der lokalen Datei hoch. Ein Arbeitsbranch, der
 * hinter main liegt, vergab damit die Nummer, die ein paralleler Branch schon
 * vergeben hatte; auf main ist am 2026-09-26 so 0.0.37 zweimal vergeben
 * worden, auf 222d2a2 und fb5f5bc. Der Zähler fragt deshalb die Basis im
 * Online-Stand ab und verweigert eine Nummer, die dort schon steht.
 */

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
)
const SCRIPT = path.join(ROOT, 'scripts/bump-version.mjs')
/** @type {string[]} */
const roots = []

afterEach(() => {
  for (const root of roots.splice(0))
    fs.rmSync(root, { recursive: true, force: true })
})

/**
 * @param {string} root
 * @param {...string} args
 * @returns {string}
 */
function git(root, ...args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' })
  if (result.status !== 0)
    throw new Error(`git ${args.join(' ')}: ${result.stderr}`)
  return result.stdout.trim()
}

/**
 * @param {string} root
 * @param {string} version
 */
function writeVersion(root, version) {
  fs.writeFileSync(path.join(root, 'VERSION'), `${version}\n`, 'utf8')
}

/** @param {string} root @returns {string} */
function readVersion(root) {
  return fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim()
}

/** @returns {string} */
function emptyRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'shinon-bump-'))
  roots.push(root)
  git(root, 'init', '--quiet')
  git(root, 'symbolic-ref', 'HEAD', 'refs/heads/main')
  git(root, 'config', 'user.email', 'zaehler@example.invalid')
  git(root, 'config', 'user.name', 'Zaehler')
  return root
}

/**
 * Ein Repo, dessen `main` die Versionskette `chain` in der Reihenfolge trägt.
 * Eine Kette muss nicht aufsteigend sein — genau daran prüft der Wächter.
 */
/**
 * @param {string[]} chain
 * @returns {string}
 */
function repoWithChain(chain) {
  const root = emptyRepo()
  for (const version of chain) {
    writeVersion(root, version)
    fs.writeFileSync(
      path.join(root, 'package.json'),
      `${JSON.stringify({ name: 'zaehler', version }, null, 2)}\n`,
      'utf8',
    )
    git(root, 'add', '-A')
    git(root, 'commit', '--quiet', '-m', `Stand ${version}`)
  }
  return root
}

/**
 * @param {string} root
 * @param {...string} args
 * @returns {{ status: number | null, stdout: string, stderr: string }}
 */
function bump(root, ...args) {
  const result = spawnSync('node', [SCRIPT, ...args], {
    cwd: root,
    encoding: 'utf8',
  })
  return {
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  }
}

describe('Der Next-Bump-Zähler', () => {
  it('zählt von der Basis hoch, wenn Branch und Basis denselben Stand haben', () => {
    const root = repoWithChain(['0.0.1', '0.0.2'])
    const result = bump(root, '--ref', 'main')
    expect(result.status).toBe(0)
    expect(readVersion(root)).toBe('0.0.3')
  })

  it('fragt die Basis statt der lokalen Datei, wenn der Branch hinterher ist', () => {
    const root = repoWithChain(['0.0.1', '0.0.2', '0.0.9'])
    // Der Arbeitsbranch steht noch auf 0.0.1, main ist auf 0.0.9.
    writeVersion(root, '0.0.1')
    const result = bump(root, '--ref', 'main')
    expect(result.status).toBe(0)
    // Blind hochgezählt hätte der Arbeitsbranch 0.0.2 geschrieben.
    expect(readVersion(root)).toBe('0.0.10')
    expect(result.stderr).toContain('0.0.9')
    expect(result.stderr).toContain('0.0.1')
  })

  it('schreibt bei --next nichts und gibt nur die Nummer aus', () => {
    const root = repoWithChain(['0.0.1', '0.0.2'])
    const before = fs.readFileSync(path.join(root, 'VERSION'), 'utf8')
    const result = bump(root, '--ref', 'main', '--next')
    expect(result.status).toBe(0)
    expect(result.stdout).toBe('0.0.3')
    expect(fs.readFileSync(path.join(root, 'VERSION'), 'utf8')).toBe(before)
  })

  it('bricht ab, statt eine in der Basis schon vergebene Nummer zu nehmen', () => {
    // 0.0.4 wurde zwischenzeitlich vergeben, main steht heute auf 0.0.3.
    const root = repoWithChain(['0.0.1', '0.0.4', '0.0.3'])
    const result = bump(root, '--ref', 'main')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('0.0.4 steht in main bereits')
    expect(readVersion(root)).toBe('0.0.3')
  })

  it('fällt auf lokal zurück und sagt es, wenn keine Basis lesbar ist', () => {
    const root = emptyRepo()
    writeVersion(root, '0.4.9')
    const result = bump(root, '--ref', 'refs/heads/gibt-es-nicht')
    expect(result.status).toBe(0)
    expect(readVersion(root)).toBe('0.4.10')
    expect(result.stderr).toContain('Keine Basis lesbar')
  })

  it('schreibt VERSION und alle vorhandenen Manifeste synchron', () => {
    const root = repoWithChain(['0.0.7'])
    for (const pkg of ['contracts', 'sim-core', 'client', 'server']) {
      const dir = path.join(root, 'packages', pkg)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(
        path.join(dir, 'package.json'),
        `${JSON.stringify({ name: pkg, version: '0.0.7' }, null, 2)}\n`,
        'utf8',
      )
    }
    expect(bump(root, '--ref', 'main').status).toBe(0)
    expect(readVersion(root)).toBe('0.0.8')
    const manifests = [
      'package.json',
      'packages/contracts/package.json',
      'packages/sim-core/package.json',
      'packages/client/package.json',
      'packages/server/package.json',
    ]
    for (const file of manifests) {
      const full = path.join(root, ...file.split('/'))
      expect(JSON.parse(fs.readFileSync(full, 'utf8')).version).toBe('0.0.8')
    }
  })

  it('trägt den Carry von 99 auf die nächste Stufe', () => {
    const root = repoWithChain(['0.1.99'])
    expect(bump(root, '--ref', 'main').status).toBe(0)
    expect(readVersion(root)).toBe('0.2.0')
  })
})
