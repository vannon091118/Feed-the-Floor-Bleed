#!/usr/bin/env node
/** Contract-Gate — Contracts bleiben reine, versionierte Zod-Verträge. */
import fs from 'node:fs'
import path from 'node:path'
import { collectSourceFiles, relativePath } from '../lib/source-scan.mjs'
import { POLICY } from '../policy.mjs'

const ROOT = process.cwd()
const {
  root: CONTRACT_DIR,
  package: CONTRACT_PACKAGE,
  zodVersion,
} = POLICY.contracts
const failures = []

if (!fs.existsSync(path.join(ROOT, CONTRACT_DIR)))
  failures.push(`${CONTRACT_DIR} fehlt`)
if (!fs.existsSync(path.join(ROOT, CONTRACT_DIR, 'index.ts')))
  failures.push(`${CONTRACT_DIR}/index.ts fehlt`)
try {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(ROOT, CONTRACT_PACKAGE), 'utf8'),
  )
  if (pkg.dependencies?.zod !== zodVersion)
    failures.push(
      `packages/contracts/package.json muss Zod ${zodVersion} als Runtime-Abhängigkeit führen`,
    )
} catch {
  failures.push(`${CONTRACT_PACKAGE} fehlt oder ist ungültiges JSON`)
}

const files = collectSourceFiles([CONTRACT_DIR])
for (const file of files) {
  const rel = relativePath(ROOT, file)
  const content = fs.readFileSync(file, 'utf8')
  const importSpecifiers = [
    ...content.matchAll(/(?:from\s+|import\s*\()['"]([^'"]+)['"]/g),
  ].map((match) => match[1])
  for (const specifier of importSpecifiers) {
    if (
      specifier !== 'zod' &&
      !specifier.startsWith('zod/') &&
      !specifier.startsWith('.')
    )
      failures.push(`${rel}: Contract-Import ${specifier} ist verboten`)
  }
  if (
    rel !== `${CONTRACT_DIR}/index.ts` &&
    !importSpecifiers.some(
      (specifier) => specifier === 'zod' || specifier.startsWith('zod/'),
    )
  ) {
    failures.push(`${rel}: Contract-Schema muss Zod explizit importieren`)
  }
  if (
    rel === `${CONTRACT_DIR}/index.ts` &&
    !/\b(sim_version|simVersion)\b/.test(content)
  ) {
    failures.push(`${rel}: sim_version fehlt im öffentlichen Contract`)
  }
}
if (failures.length > 0) {
  console.error('💥 Contract-Gate blockiert:')
  for (const failure of [...new Set(failures)]) console.error(`  - ${failure}`)
  process.exit(1)
}
console.log(
  `✅ Contract-Gate ok — ${files.length} Contract-Quellen, sim_version, Zod und Grenzen geprüft.`,
)
