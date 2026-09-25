#!/usr/bin/env node
/**
 * Shinon — modulare Commit-Gate & Test Engine.
 * Slicing nach git diff, Plugin-Slices als isolierte Checks.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'

const ROOT = process.cwd()

function getChangedFiles({ staged }) {
  try {
    const ref = staged ? '--cached' : 'HEAD'
    // staged = git diff --cached --name-only ; unstaged vs HEAD
    const args = staged ? 'diff --cached --name-only' : 'diff --name-only HEAD'
    const out = execSync(`git ${args}`, { encoding: 'utf8', cwd: ROOT })
    return out.split('\n').map((s) => s.trim()).filter(Boolean)
  } catch {
    return []
  }
}

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

function shouldRun(pluginName, changedFiles, forceFull) {
  if (forceFull) return true
  const any = (pred) => changedFiles.some((f) => pred(f))
  switch (pluginName) {
    case 'loc-gate':
      return true
    case 'hygiene-gate':
      return true
    case 'version-gate':
      return true
    case 'commit-gate':
      return true
    case 'core-determinism':
      return any((f) => f.startsWith('packages/sim-core/') || f.startsWith('packages/contracts/'))
    case 'schema-contract':
      return any((f) => f.startsWith('packages/contracts/') || f.includes('/sync/') || f.includes('/net/'))
    case 'false-positive':
      return any((f) => f.includes('/combat/') || f.includes('/genome/') || f.includes('/matchmaking/') || f.includes('/sync/'))
    default:
      return true
  }
}

function runPlugin(plugin, changedFiles) {
  const res = spawnSync('node', [plugin.path, '--changed', changedFiles.join(',')], {
    encoding: 'utf8',
    cwd: ROOT,
    timeout: 60_000,
  })
  const ok = res.status === 0
  return { ok, stdout: (res.stdout || '').trim(), stderr: (res.stderr || '').trim(), code: res.status }
}

function main() {
  const args = process.argv.slice(2)
  const forceFull = args.includes('--full') || args.includes('--push')
  const staged = !forceFull // pre-commit = staged, pre-push/full = HEAD diff
  const changedFiles = forceFull
    ? (() => {
        try {
          const out = execSync('git diff --name-only HEAD', { encoding: 'utf8', cwd: ROOT })
          const stagedOut = execSync('git diff --cached --name-only', { encoding: 'utf8', cwd: ROOT })
          const set = new Set([...out.split('\n'), ...stagedOut.split('\n')].map((s) => s.trim()).filter(Boolean))
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

  console.log(`🦊 Shinon Gate — ${forceFull ? 'FULL' : 'SLICE'} Mode — ${changedFiles.length} geänderte Dateien`)
  if (changedFiles.length > 0) {
    for (const f of changedFiles) console.log(`  • ${f}`)
  }

  let failed = false
  const results = []

  for (const p of plugins) {
    const run = shouldRun(p.name, changedFiles, forceFull)
    if (!run) {
      console.log(`⏭️  ${p.name} — geskippt (kein relevanter Slice)`)
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
    console.error('\n💥 Shinon Verdict: FAIL — Commit geblockt. Fix die markierten Plugins.')
    process.exit(1)
  } else {
    console.log('\n✅ Shinon Verdict: PASS — alle relevanten Gates bestanden.')
    // Auto-Push nur im post-commit Kontext, nicht hier
  }
}

main()
