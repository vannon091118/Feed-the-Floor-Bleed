#!/usr/bin/env node
/** Modularity-Gate — verbietet Domain-Leaks, Cross-Package-Deep-Imports und Zyklen. */
import fs from 'node:fs'
import path from 'node:path'
import { collectSourceFiles, relativePath } from '../lib/source-scan.mjs'
import { POLICY } from '../policy.mjs'

const ROOT = process.cwd()
const DOMAINS = POLICY.modularity.domains
const ALLOWED = Object.fromEntries(
  Object.entries(POLICY.modularity.allowed).map(([owner, allowed]) => [
    owner,
    new Set(allowed),
  ]),
)
const failures = []

function isInside(root, candidate) {
  const rel = path.relative(root, candidate)
  return (
    rel === '' ||
    (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel))
  )
}

function domainFor(file) {
  const rel = relativePath(ROOT, file)
  return Object.keys(DOMAINS).find((owner) =>
    rel.startsWith(`${DOMAINS[owner]}/`),
  )
}

function importsOf(content) {
  const patterns = [
    /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]
  return patterns.flatMap((pattern) =>
    [...content.matchAll(pattern)].map((match) => match[1]),
  )
}

function targetFor(file, specifier, owner) {
  if (specifier.startsWith('.')) {
    const resolved = path.resolve(path.dirname(file), specifier)
    if (!isInside(path.join(ROOT, DOMAINS[owner]), resolved)) {
      failures.push(
        `${relativePath(ROOT, file)}: Owner ${owner} verlässt mit ${specifier} das eigene Package`,
      )
    }
    const targetOwner = domainFor(resolved)
    return targetOwner === owner ? null : targetOwner
  }

  const alias = specifier.match(/^@(?:floor|maze)\/([^/]+)(?:\/(.+))?$/)
  if (!alias) return null
  const [, targetOwner, subpath] = alias
  if (!DOMAINS[targetOwner]) {
    failures.push(
      `${relativePath(ROOT, file)}: unbekannter Package-Alias ${specifier}`,
    )
    return null
  }
  if (subpath && (targetOwner === 'contracts' || targetOwner === 'sim-core')) {
    failures.push(
      `${relativePath(ROOT, file)}: Deep-Import ${specifier} ist für Owner ${owner} verboten`,
    )
  }
  return targetOwner
}

const files = collectSourceFiles(
  Object.values(DOMAINS).map((root) => path.join(ROOT, root, 'src')),
)
const graph = new Map(Object.keys(DOMAINS).map((owner) => [owner, new Set()]))
for (const file of files) {
  const owner = domainFor(file)
  if (!owner) {
    failures.push(`${relativePath(ROOT, file)}: keine Package-Owner-Zuordnung`)
    continue
  }
  for (const specifier of importsOf(fs.readFileSync(file, 'utf8'))) {
    const targetOwner = targetFor(file, specifier, owner)
    if (!targetOwner) continue
    if (!ALLOWED[owner].has(targetOwner)) {
      failures.push(
        `${relativePath(ROOT, file)}: ${specifier} verletzt ${owner}-Grenze zu ${targetOwner}`,
      )
    }
    graph.get(owner).add(targetOwner)
  }
}

function visit(node, stack, done) {
  if (stack.includes(node)) {
    failures.push(`Import-Zyklus: ${[...stack, node].join(' → ')}`)
    return
  }
  if (done.has(node)) return
  stack.push(node)
  for (const next of graph.get(node) || []) visit(next, stack, done)
  stack.pop()
  done.add(node)
}
for (const owner of Object.keys(DOMAINS)) visit(owner, [], new Set())
if (failures.length > 0) {
  console.error('💥 Modularity-Gate blockiert:')
  for (const failure of [...new Set(failures)]) console.error(`  - ${failure}`)
  process.exit(1)
}
console.log(
  `✅ Modularity-Gate ok — ${files.length} Quellen, keine verbotenen Domain-Grenzen oder Zyklen.`,
)
