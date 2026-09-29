#!/usr/bin/env node
import { execSync, spawnSync } from 'node:child_process'
/**
 * Shinon — modulare Commit-Gate & Test Engine.
 * Slicing nach git diff, Plugin-Slices als isolierte Checks.
 *
 * Drei Betriebsarten: `SLICE` (Standard, staged Diff), `--full` (alle Plugins,
 * der Job `Shinon Gate` und die Bündel-Probe) und `--local` (nur die kurze
 * Menge aus `policy.engine.local`, die Hooks pre-commit und pre-push). Der
 * lokale Pfad trägt seit dem 2026-09-29 nur noch, was einen Commit durchlässt;
 * Typecheck, Redundanz, Contract-Schema und die Slices liegen remote.
 */
import fs from 'node:fs'
import path from 'node:path'
import { shouldRun, shouldRunLocal } from './lib/engine-policy.mjs'
import { POLICY } from './policy.mjs'

const ROOT = process.cwd()

/**
 * @param {{ staged: boolean }} options
 * @returns {string[]}
 */
function getChangedFiles({ staged }) {
  try {
    // staged = git diff --cached --name-only ; unstaged vs HEAD
    const args = staged ? 'diff --cached --name-only' : 'diff --name-only HEAD'
    const out = execSync(`git ${args}`, { encoding: 'utf8', cwd: ROOT })
    return out
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

/** @returns {{ name: string, path: string }[]} */
function loadPlugins() {
  const dir = path.join(ROOT, 'scripts/shinon/plugins')
  if (!fs.existsSync(dir)) return []
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mjs'))
  const plugins = []
  for (const f of files) {
    const full = path.join(dir, f)
    plugins.push({ name: path.basename(f, '.mjs'), path: full })
  }
  return plugins.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * @param {{ name: string, path: string }} plugin
 * @param {string[]} changedFiles
 * @returns {{ ok: boolean, stdout: string, stderr: string, code: number | null }}
 */
function runPlugin(plugin, changedFiles) {
  const res = spawnSync(
    'node',
    [plugin.path, '--changed', changedFiles.join(',')],
    {
      encoding: 'utf8',
      cwd: ROOT,
      timeout: 60_000,
    },
  )
  const ok = res.status === 0
  return {
    ok,
    stdout: (res.stdout || '').trim(),
    stderr: (res.stderr || '').trim(),
    code: res.status,
  }
}

function main() {
  const args = process.argv.slice(2)
  const forceFull = args.includes('--full') || args.includes('--push')
  const localOnly = args.includes('--local')
  // pre-commit prüft den Index, --full/--push den Stand gegen HEAD. Das lokale
  // Minimal-Gate braucht keinen Diff: Seine Menge steht fest in der Policy.
  const changedFiles = localOnly
    ? []
    : forceFull
      ? (() => {
          try {
            const out = execSync('git diff --name-only HEAD', {
              encoding: 'utf8',
              cwd: ROOT,
            })
            const stagedOut = execSync('git diff --cached --name-only', {
              encoding: 'utf8',
              cwd: ROOT,
            })
            const set = new Set(
              [...out.split('\n'), ...stagedOut.split('\n')]
                .map((s) => s.trim())
                .filter(Boolean),
            )
            return [...set]
          } catch {
            return []
          }
        })()
      : getChangedFiles({ staged: true })

  const plugins = loadPlugins()
  if (plugins.length === 0) {
    console.log('⚠️  Shinon: keine Plugins gefunden — nur Global Gates laufen')
  }

  console.log(
    `🦊 Shinon Gate — ${localOnly ? `LOCAL (${POLICY.engine.local.length} Plugins)` : forceFull ? 'FULL' : 'SLICE'} Mode — ${changedFiles.length} geänderte Dateien`,
  )
  if (changedFiles.length > 0) {
    for (const f of changedFiles) console.log(`  • ${f}`)
  }

  let failed = false
  const results = []

  for (const p of plugins) {
    const run = localOnly
      ? shouldRunLocal(p.name, POLICY)
      : shouldRun(p.name, changedFiles, forceFull, POLICY)
    if (!run) {
      console.log(
        `⏭️  ${p.name} — geskippt (${localOnly ? 'nicht im lokalen Minimal-Gate' : 'kein relevanter Slice'})`,
      )
      results.push({ name: p.name, skipped: true })
      continue
    }
    console.log(`▶️  ${p.name}...`)
    const r = runPlugin(p, changedFiles)
    if (r.ok) {
      console.log(`✅ ${p.name} — bestanden`)
      if (r.stdout) console.log(r.stdout)
    } else {
      console.error(`💥 ${p.name} — FAILED (exit ${r.code})`)
      if (r.stdout) console.error(r.stdout)
      if (r.stderr) console.error(r.stderr)
      failed = true
    }
    results.push({ name: p.name, ok: r.ok, skipped: false })
  }

  if (failed) {
    console.error(
      '\n💥 Shinon Verdict: FAIL — Commit geblockt. Fix die markierten Plugins.',
    )
    process.exit(1)
  } else {
    console.log('\n✅ Shinon Verdict: PASS — alle relevanten Gates bestanden.')
    // Auto-Push nur im post-commit Kontext, nicht hier
  }
}

main()
