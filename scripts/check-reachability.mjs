#!/usr/bin/env node
/**
 * Reichweiten-Gate — ein Modul, das niemand importiert, ist tot.
 *
 * Die Redundanz-Gate vergleicht Zeilen und findet kopierte Blöcke. Sie findet
 * den toten Zweig nicht: ein Modul kann vorbildlich geschrieben, getestet und
 * vollständig unbenutzt sein. Dieser Check stellt die Frage, die beim Aufrumen
 * immer gestellt wird — *wer importiert das überhaupt?* — und misst sie am
 * Import.
 *
 * **Die Einheit ist das Modul, nicht der Export.** Ein früherer Entwurf prüfte
 * einzelne Exporte und meldete 83 von 459. Das waren keine toten Systeme,
 * sondern Typen wie `StageProps` oder `DeepReadonly`, die strukturell nur in
 * ihrem eigenen Modul gelten und trotzdem als Teil des Vertrags exportiert
 * sind. Eine Regel, die das als Fehler meldet, verbietet die Signatur einer
 * öffentlichen Schnittstelle — und erfindet beim Ausräumen Arbeit, die nichts
 * findet. Auf Modulebene gemessen war der Bestand dagegen sauber.
 *
 * Reachability ab `main.tsx` wäre die strengere Fassung, würde aber jeden
 * bewusst abnehmerlosen Owner (`village/plot.ts` ist so einer, mit ausdrücklich
 * dokumentierter Abnehmerlosigkeit) als Fehler melden. Das ist eine
 * Architekturfrage und gehört nicht in einen Check.
 *
 * Ausgenommen sind `main.tsx` (der Einstieg), mitgelaufene Tests und
 * `.d.ts`-Dateien: Sie haben per Definition keinen Import-Eltern.
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CLIENT = path.join(ROOT, 'packages', 'client')
const SRC = path.join(CLIENT, 'src')

const SOURCE = /\.(ts|tsx|mjs)$/

/** Dateien, die per Definition niemand importieren darf. */
const EXEMPT = /(^main$|\.test$|\.d$)/

/**
 * @param {string} dir
 * @param {string[]} [out]
 * @returns {string[]}
 */
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (SOURCE.test(entry.name)) out.push(full)
  }
  return out
}

/**
 * Der Modulname ohne Endung, relativ zu `srcDir`.
 *
 * @param {string} srcDir
 * @param {string} file
 * @returns {string}
 */
function moduleName(srcDir, file) {
  return path
    .relative(srcDir, file)
    .replace(/\.(ts|tsx|mjs)$/, '')
    .replace(/\/index$/, '')
}

/**
 * Sucht einen Import dieses Moduls in einem Text.
 *
 * Gematcht wird auf das **Basisnamen-Level**, weil die Importe in diesem
 * Client relativer Natur sind: `village/render/village-layout.ts` wird als
 * `'./village-layout'` importiert, nicht als sein voller Pfad. Der Preis
 * dafür ist, dass zwei Module mit gleichem Basisnamen sich gegenseitig
 * unschuldig machen — ein Fehlalarm weniger, und ein Gate soll im Zweifel
 * schweigen statt zu beschuldigen.
 *
 * Beide Importformen zählen: `from './x'` (mit Bindung) und `import './x'`
 * (Nebenwirkung, ohne `from`). Die zweite ist im Client die verbreitetere —
 * wer sie übersieht, meldet lebende Dateien als tot.
 *
 * @param {string} text
 * @param {string} name
 * @returns {boolean}
 */
function importsModule(text, name) {
  const base = path.basename(name)
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:from\\s+|import\\s+)['"][^'"]*\\/?${escaped}['"]`).test(
    text,
  )
}

/**
 * Die toten Module unter `srcDir`.
 *
 * Der Ordner ist ein Parameter, damit der Test einen belegten Fundfall gegen
 * denselben Code prüfen kann, den der Build benutzt — ein Test mit einer
 * zweiten Kopie der Regel prüft nichts.
 *
 * @param {string} [srcDir]
 * @returns {string[]}
 */
export function findDeadModules(srcDir = SRC) {
  const client = path.dirname(srcDir)
  const sources = walk(srcDir).filter(
    (f) => !EXEMPT.test(moduleName(srcDir, f)),
  )
  const readers = walk(client)
    .concat(walk(path.join(ROOT, 'scripts', 'shinon')))
    .map((f) => ({
      name: moduleName(srcDir, f),
      text: fs.readFileSync(f, 'utf8'),
    }))

  return sources.filter((file) => {
    const name = moduleName(srcDir, file)
    return !readers.some((r) => r.name !== name && importsModule(r.text, name))
  })
}

if (process.argv[1]?.endsWith('check-reachability.mjs')) {
  const dead = findDeadModules()
  if (dead.length > 0) {
    for (const file of dead) {
      console.error(
        `💥 totes Modul — niemand importiert es: ${path.relative(ROOT, file)}`,
      )
    }
    console.error(
      `\nFix: Einen Import bauen oder das Modul löschen. Ein Kommentar ersetzt keinen Abnehmer.`,
    )
    process.exit(1)
  }
  console.log('✅ Reichweiten-Gate ok — jedes Modul wird gelesen.')
}
