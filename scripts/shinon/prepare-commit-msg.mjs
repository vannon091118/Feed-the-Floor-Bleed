#!/usr/bin/env node
/**
 * prepare-commit-msg — technische Absicherung für Integrations-Commits.
 *
 * Läuft vor commit-msg. Erzeugt Git gerade einen Merge- oder Squash-Commit mit
 * zu dünnem Body, ersetzt dieser Hook den Text durch einen generierten,
 * gate-konformen. Ein normaler Commit wird nie angefasst.
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import { checkMessage } from './lib/commit-text.mjs'
import { buildIntegrationMessage } from './lib/integration-text.mjs'

const INTEGRATION_SOURCES = new Set(['merge', 'squash'])
const [file, source] = process.argv.slice(2)

if (!file || !fs.existsSync(file)) process.exit(0)
if (!INTEGRATION_SOURCES.has(source ?? '')) process.exit(0)

function stagedFiles() {
  try {
    return execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

const files = stagedFiles()
const raw = fs.readFileSync(file, 'utf8')
if (checkMessage(raw, files).ok) process.exit(0)

const generated = buildIntegrationMessage({
  action: source === 'squash' ? 'pr' : 'merge',
  target: 'den vorbereiteten Stand',
  files,
})
fs.writeFileSync(file, generated.text, 'utf8')
console.error(`🦊 prepare-commit-msg — Integrations-Body erzeugt (${source}).`)
