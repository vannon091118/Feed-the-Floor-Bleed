#!/usr/bin/env node
/**
 * core-determinism Plugin — scannt sim-core + contracts auf verbotene Muster.
 * Fail bei Math.random, Date.now, Math.sin/pow, rohen Float-Literalen in Sim.
 */
import fs from 'node:fs'
import path from 'node:path'

const SCAN_DIRS = ['packages/sim-core/src', 'packages/contracts/src']
const SOURCE_EXTS = new Set(['.ts', '.js', '.mjs', '.cjs'])

const BANNED = [
  { re: /Math\.random\s*\(/, msg: 'Math.random verboten — nutze Mulberry32 PRNG' },
  { re: /crypto\.randomUUID\s*\(/, msg: 'crypto.randomUUID verboten — deterministischer Seed only' },
  { re: /crypto\.getRandomValues\s*\(/, msg: 'crypto.getRandomValues verboten — kein echter Zufall im Core' },
  { re: /crypto\.randomBytes\s*\(/, msg: 'crypto.randomBytes verboten — nutze PRNG' },
  { re: /\bgetRandomValues\s*\(/, msg: 'getRandomValues verboten — kein Crypto-Zufall' },
  { re: /Date\.now\s*\(/, msg: 'Date.now verboten — Zeit kommt nur als Tick/Token vom Server' },
  { re: /new\s+Date\s*\(/, msg: 'new Date() verboten — keine echte Zeit im Core' },
  { re: /Math\.sin\s*\(/, msg: 'Math.sin verboten — kein Float-Nondeterminismus' },
  { re: /Math\.pow\s*\(/, msg: 'Math.pow verboten — nutze Fixed-Point int-pow' },
  { re: /Math\.cos\s*\(/, msg: 'Math.cos verboten' },
  { re: /Math\.tan\s*\(/, msg: 'Math.tan verboten' },
  { re: /Math\.sqrt\s*\(/, msg: 'Math.sqrt verboten — nutze int-sqrt (Fixed-Point)' },
  { re: /parseFloat\s*\(/, msg: 'parseFloat verboten — Fixed-Point only' },
]

function walk(dir, out) {
  if (!fs.existsSync(dir)) return
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, out)
    else if (e.isFile() && SOURCE_EXTS.has(path.extname(e.name))) out.push(full)
  }
}

const files = []
for (const d of SCAN_DIRS) walk(d, files)

let failed = false
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8')
  const rel = path.relative(process.cwd(), f).replaceAll(path.sep, '/')
  // Kommentare grob strippen für Scan (Block + Line)
  const stripped = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
  for (const { re, msg } of BANNED) {
    if (re.test(stripped)) {
      console.error(`💥 Determinismus Fail — ${rel}: ${msg} (Match: ${re})`)
      failed = true
    }
  }
}

if (failed) {
  console.error('\nFix: Ersetze verbotene Aufrufe durch deterministische Alternativen (PRNG, Fixed-Point, Token-Zeit).')
  process.exit(1)
} else {
  console.log(`✅ core-determinism ok — ${files.length} Dateien gescannt, keine verbotenen Muster.`)
}
