#!/usr/bin/env node
/** Lädt und validiert die versionierbare Shinon-Policy als Single Source of Truth. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parsePolicy } from './policy-schema.mjs'

const policyFile = fileURLToPath(new URL('./policy.json', import.meta.url))
const policyDir = path.dirname(policyFile)

export function validateEnginePlugins(policy, knownPlugins) {
  const known = new Set(knownPlugins)
  const configured = new Set([
    ...policy.engine.always,
    ...Object.keys(policy.engine.slices),
  ])
  const errors = []
  for (const name of configured) {
    if (!known.has(name))
      errors.push(
        `engine: Plugin-Name ${name} besitzt keine Datei in scripts/shinon/plugins/`,
      )
  }
  for (const name of known) {
    if (!configured.has(name))
      errors.push(
        `engine: Plugin-Datei ${name} ist weder als Always-Gate noch als Slice konfiguriert`,
      )
  }
  return { ok: errors.length === 0, errors }
}

export function loadPolicy(input) {
  const result = parsePolicy(input)
  return result.ok
    ? { ok: true, policy: result.policy, usedFallback: false }
    : { ok: false, errors: result.errors, usedFallback: false }
}

let rawPolicy
try {
  rawPolicy = JSON.parse(fs.readFileSync(policyFile, 'utf8'))
} catch (error) {
  console.error(
    `💥 Policy ungültig — JSON konnte nicht gelesen werden: ${error.message}`,
  )
  process.exit(1)
}

const loaded = loadPolicy(rawPolicy)
if (!loaded.ok) {
  console.error(
    '💥 Policy-Schema ungültig — bekannte Pflichtfelder fehlen, haben falsche Typen oder eine inkompatible Version:',
  )
  for (const issue of loaded.errors) console.error(`  - ${issue}`)
  process.exit(1)
}

const pluginDir = path.join(policyDir, 'plugins')
const knownPlugins = fs
  .readdirSync(pluginDir)
  .filter((file) => file.endsWith('.mjs'))
  .map((file) => path.basename(file, '.mjs'))
const pluginCheck = validateEnginePlugins(loaded.policy, knownPlugins)
if (!pluginCheck.ok) {
  console.error(
    '💥 Policy-Engine ungültig — Plugin-Oberfläche und Trigger passen nicht zusammen:',
  )
  for (const issue of pluginCheck.errors) console.error(`  - ${issue}`)
  process.exit(1)
}

export const POLICY = loaded.policy
