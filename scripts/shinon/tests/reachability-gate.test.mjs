import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { findDeadModules } from '../../check-reachability.mjs'

/**
 * Der Reichweiten-Zaun gegen einen belegten Fundfall.
 *
 * Der Test prüft dieselbe Funktion, die der Build benutzt, und fragt in zwei
 * Schritten: erst wird der tote Zweig gefunden, dann nach dem Bau eines
 * Importierers wieder freigegeben. Eine Regel, die nur den roten Fall kennt,
 * würde auch jeden gültigen Import als tot melden — das ist der Fehler, den
 * der Test verhindern soll.
 */

/** @type {string} */
let dir

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true })
})

/**
 * @param {Record<string, string>} files
 * @returns {string} der Wurzel des Fixture-`src`
 */
function fixture(files) {
  dir = mkdtempSync(join(tmpdir(), 'reach-'))
  for (const [name, content] of Object.entries(files)) {
    const file = join(dir, 'src', name)
    mkdirSync(join(file, '..'), { recursive: true })
    writeFileSync(file, content)
  }
  return join(dir, 'src')
}

describe('Reichweiten-Gate', () => {
  // Die Fixture-Namen sind gegen den echten Baum geprüft und kollidieren mit
  // keinem Import dort. Das ist keine Kosmetik: `scripts/shinon` gehört zur
  // Leser-Menge, also ist diese Datei selbst ein Leser. Ein Fixture-Name, den
  // irgendwo im Repo importiert wird — oder der hier als Zeichenkette steht —
  // gibt das tote Modul frei und macht den roten Fall grün.
  it('meldet ein Modul, das niemand importiert', () => {
    const src = fixture({
      'main.tsx': "import './eingang'\n",
      'eingang.ts': "import { a } from './traeger'\nexport const c = a\n",
      'traeger.ts': 'export const a = 1\n',
      'verwaist.ts': 'export const b = 2\n',
    })
    const dead = findDeadModules(src).map((f) => f.split('/').pop())
    expect(dead).toEqual(['verwaist.ts'])
  })

  it('gibt das Modul frei, sobald ein Importierer existiert', () => {
    const src = fixture({
      'main.tsx': "import './eingang'\n",
      'eingang.ts': "import { b } from './klinke'\nexport const c = b\n",
      'klinke.ts': 'export const b = 2\n',
    })
    expect(findDeadModules(src)).toEqual([])
  })

  it('lässt Einstieg, mitgelaufene Tests und .d.ts in Ruhe', () => {
    const src = fixture({
      'main.tsx': "import './eingang'\n",
      'eingang.ts': 'export const a = 1\n',
      'eingang.test.ts': "import { a } from './eingang'\n",
      'globals.d.ts': 'export {}\n',
    })
    expect(findDeadModules(src)).toEqual([])
  })

  it('erkennt einen verschachtelten Pfad an seinem Basisnamen', () => {
    const src = fixture({
      'main.tsx': "import './dorf/render/ansicht'\n",
      'dorf/render/kulisse.ts': 'export const a = 1\n',
      'dorf/render/ansicht.ts':
        "import { a } from './kulisse'\nexport const c = a\n",
    })
    expect(findDeadModules(src)).toEqual([])
  })

  it('meldet im echten Repository kein totes Modul', () => {
    expect(findDeadModules()).toEqual([])
  })
})
