import { baseGenome, lootProfile } from '@floor/sim-core'
import { describe, expect, it } from 'vitest'
import { BALANCE } from './balance'
import { goldForOpponent, goldForRun } from './loot'

/**
 * Tests der Goldformel gegen die Tabelle in `docs/GOLDFORMEL.md`.
 *
 * Die Tabelle ist die abgenommene Fassung: stimmt eine Zelle nicht mehr, ist
 * nicht der Test falsch, sondern die freigegebene Zahl wurde verschoben. Ein
 * Test, der seine eigenen Zahlen neu erfindet, prüft nichts.
 */

describe('goldForOpponent', () => {
  it('rechnet die veröffentlichte Tabelle nach', () => {
    // [Stärke, Generation, erwartetes Gold] — Zeilen und Spalten aus der Doku.
    const rows: [number, number, number][] = [
      [1, 1, 40],
      [1, 2, 50],
      [1, 3, 60],
      [1, 5, 80],
      [1, 9, 120],
      [2, 1, 80],
      [2, 2, 100],
      [2, 9, 240],
      [3, 1, 120],
      [3, 5, 240],
      [5, 1, 200],
      [5, 9, 600],
    ]
    for (const [strength, generation, expected] of rows) {
      const result = goldForOpponent({ strength, generation }, BALANCE)
      expect(result).toEqual({ ok: true, gold: expected })
    }
  })

  it('weist eine gebrochene oder negative Stärke ab', () => {
    for (const strength of [1.5, -1, NaN, Infinity]) {
      const result = goldForOpponent({ strength, generation: 1 }, BALANCE)
      expect(result).toEqual({
        ok: false,
        reason: 'not-whole-strength',
        strength,
      })
    }
  })

  it('weist eine Generation unter 1 ab', () => {
    for (const generation of [0, -1, NaN, 2.5]) {
      const result = goldForOpponent({ strength: 1, generation }, BALANCE)
      expect(result).toEqual({
        ok: false,
        reason: 'below-first-generation',
        generation,
      })
    }
  })

  it('trägt für Stärke 0 nichts bei, ohne das für einen Fehler zu halten', () => {
    const result = goldForOpponent({ strength: 0, generation: 4 }, BALANCE)
    expect(result).toEqual({ ok: true, gold: 0 })
  })

  it('rundet auf ganze Goldstücke ab', () => {
    // Stärke 1, Generation 1 ergibt 40 · (1000 + 250) / 1000 = 50.0.
    // Eine Konfiguration mit ungeradem Teiler zeigt das floor sichtbar.
    const odd = {
      ...BALANCE,
      loot: { goldPerOpponent: 41, generationStepPermille: 250 },
    } as typeof BALANCE
    const result = goldForOpponent({ strength: 1, generation: 2 }, odd)
    expect(result).toEqual({ ok: true, gold: 51 })
  })
})

describe('goldForRun', () => {
  it('summiert die gefallenen Gegner', () => {
    const result = goldForRun(
      [
        { strength: 1, generation: 1 },
        { strength: 1, generation: 1 },
        { strength: 2, generation: 2 },
      ],
      BALANCE,
    )
    expect(result).toEqual({ ok: true, gold: 180 })
  })

  it('liefert 0 für ein leeres Ergebnis, auch ohne Gegner', () => {
    expect(goldForRun([], BALANCE)).toEqual({ ok: true, gold: 0 })
  })

  it('weist den Run ab, wenn ein Gegner ungültig ist', () => {
    const result = goldForRun(
      [
        { strength: 2, generation: 1 },
        { strength: 1, generation: 0 },
      ],
      BALANCE,
    )
    expect(result).toEqual({
      ok: false,
      reason: { ok: false, reason: 'below-first-generation', generation: 0 },
    })
  })
})

/**
 * Die Naht zwischen den beiden Domänen.
 *
 * Die Tabelle oben ist eine Rechnung über eingesetzte Zahlen. Dieser Block
 * rechnet mit echten Genomen aus `@floor/sim-core`: `lootProfile` liest Stärke
 * und Generation aus dem Genom, und `goldForOpponent` rechnet daraus. Damit ist
 * belegt, dass die Formel nicht nur auf Zahlen funktioniert, die jemand
 * passend eingesetzt hat, sondern auf dem Wesen, das tatsächlich im Bestand
 * liegt. Fällt eine der beiden Seiten auseinander, fällt dieser Test.
 */
describe('Goldformel an echten Genomen', () => {
  it('rechnet den Steingolem in Stärke 5 auf 200 Gold der ersten Generation', () => {
    const profile = lootProfile(baseGenome('stone-golem'))
    expect(profile).toEqual({ strength: 5, generation: 1 })
    expect(goldForOpponent(profile, BALANCE)).toEqual({ ok: true, gold: 200 })
  })

  it('rechnet den Shadeprowler in Stärke 0 auf 0 Gold, ohne Fehler', () => {
    const profile = lootProfile(baseGenome('shade-prowler'))
    expect(profile).toEqual({ strength: 0, generation: 1 })
    expect(goldForOpponent(profile, BALANCE)).toEqual({ ok: true, gold: 0 })
  })

  it('summiert einen gemischten Run echter Genome', () => {
    const run = goldForRun(
      [
        lootProfile(baseGenome('frost-wolf')), // Stärke 2, Gen 1 → 80
        lootProfile(baseGenome('ash-revenant')), // Stärke 3, Gen 1 → 120
        lootProfile(baseGenome('shard-imp')), // Stärke 0, Gen 1 → 0
      ],
      BALANCE,
    )
    expect(run).toEqual({ ok: true, gold: 200 })
  })
})
