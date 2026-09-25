#!/usr/bin/env node
/** core-determinism Plugin — scannt sim-core + contracts auf verbotene Muster. */
import fs from 'node:fs'
import {
  collectSourceFiles,
  relativePath,
  stripComments,
} from '../lib/source-scan.mjs'
import { POLICY } from '../policy.mjs'

const ROOT = process.cwd()
const BANNED = [
  {
    re: /Math\.random\s*\(/,
    msg: 'Math.random verboten — nutze Mulberry32 PRNG',
  },
  {
    re: /crypto\.randomUUID\s*\(/,
    msg: 'crypto.randomUUID verboten — deterministischer Seed only',
  },
  {
    re: /crypto\.getRandomValues\s*\(/,
    msg: 'crypto.getRandomValues verboten — kein echter Zufall im Core',
  },
  {
    re: /crypto\.randomBytes\s*\(/,
    msg: 'crypto.randomBytes verboten — nutze PRNG',
  },
  {
    re: /\bgetRandomValues\s*\(/,
    msg: 'getRandomValues verboten — kein Crypto-Zufall',
  },
  {
    re: /Date\.now\s*\(/,
    msg: 'Date.now verboten — Zeit kommt nur als Tick/Token vom Server',
  },
  {
    re: /new\s+Date\s*\(/,
    msg: 'new Date() verboten — keine echte Zeit im Core',
  },
  {
    re: /Math\.sin\s*\(/,
    msg: 'Math.sin verboten — kein Float-Nondeterminismus',
  },
  {
    re: /Math\.pow\s*\(/,
    msg: 'Math.pow verboten — nutze Fixed-Point int-pow',
  },
  { re: /Math\.cos\s*\(/, msg: 'Math.cos verboten' },
  { re: /Math\.tan\s*\(/, msg: 'Math.tan verboten' },
  {
    re: /Math\.sqrt\s*\(/,
    msg: 'Math.sqrt verboten — nutze int-sqrt (Fixed-Point)',
  },
  { re: /parseFloat\s*\(/, msg: 'parseFloat verboten — Fixed-Point only' },
]

let failed = false
const files = collectSourceFiles(POLICY.coreDeterminism.roots)
for (const file of files) {
  const content = stripComments(fs.readFileSync(file, 'utf8'))
  const rel = relativePath(ROOT, file)
  for (const { re, msg } of BANNED) {
    if (re.test(content)) {
      console.error(`💥 Determinismus Fail — ${rel}: ${msg} (Match: ${re})`)
      failed = true
    }
  }
}
if (failed) {
  console.error(
    '\nFix: Ersetze verbotene Aufrufe durch deterministische Alternativen (PRNG, Fixed-Point, Token-Zeit).',
  )
  process.exit(1)
}
console.log(
  `✅ core-determinism ok — ${files.length} Dateien gescannt, keine verbotenen Muster.`,
)
