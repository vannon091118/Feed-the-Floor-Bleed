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
