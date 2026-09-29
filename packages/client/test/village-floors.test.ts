import { afterEach, describe, expect, it } from 'vitest'
// Über das Barrel der Domäne, so wie ein Aufrufer außerhalb sie sieht.
import {
  buyFloor,
  commitVillage,
  dayNight,
  resetDayNight,
  setPhase,
  type VillageHoldings,
} from '../src/village'
import { BALANCE } from '../src/village/balance'

/**
 * Das Etage-Kommando: der Kauf der nächsten Etage zum quadratischen Preis.
 *
 * Eigene Datei, weil `village-commands.test.ts` am globalen Zeilen-Cap stand —
 * und weil der Kauf ein eigener Owner ist: hier wächst die Expedition, dort das
 * Dorf. Geprüft wird nach jedem Befehl der Bestand und nicht nur das Ergebnis;
 * ein Kommando, das `ok: false` meldet und trotzdem abbucht, wäre sonst grün.
 */

/**
 * Ein gestellter Bestand über denselben Schreibpfad, den die Kommandos nutzen:
 * Die Figur ersetzt die Freigabetabelle, die Prüfung bleibt dieselbe.
 */
function mitBestand(gold: number, materials: number): void {
  expect(
    commitVillage({
      ...dayNight.value.village,
      resources: { gold, materials },
    }),
  ).toBe(true)
}

function bestand(): VillageHoldings {
  return dayNight.value.village
}

afterEach(() => {
  resetDayNight()
})

describe('Etage kaufen', () => {
  it('kauft die nächste Etage und zahlt genau den quadratischen Preis', () => {
    mitBestand(BALANCE.dungeon.floorBase * 2 * 2, 0)
    const vorher = bestand()
    const erwartet = BALANCE.dungeon.floorBase * 2 * 2

    expect(buyFloor(BALANCE)).toEqual({
      ok: true,
      floors: 2,
      cost: erwartet,
    })
    expect(bestand().floors).toBe(2)
    expect(bestand().resources.gold).toBe(vorher.resources.gold - erwartet)
    expect(bestand().resources.materials).toBe(vorher.resources.materials)
    expect(bestand().buildings).toEqual(vorher.buildings)
  })

  it('zählt Etage für Etage hoch, der Preis wächst quadratisch', () => {
    mitBestand(BALANCE.dungeon.floorBase * (2 * 2 + 3 * 3), 0)
    expect(buyFloor(BALANCE)).toEqual({
      ok: true,
      floors: 2,
      cost: BALANCE.dungeon.floorBase * 2 * 2,
    })
    expect(buyFloor(BALANCE)).toEqual({
      ok: true,
      floors: 3,
      cost: BALANCE.dungeon.floorBase * 3 * 3,
    })
    expect(bestand().floors).toBe(3)
  })

  it('kauft keine Etage ohne Deckung und hinterlässt nichts', () => {
    mitBestand(10, 0)
    expect(buyFloor(BALANCE)).toEqual({
      ok: false,
      reason: 'not-affordable',
      cost: BALANCE.dungeon.floorBase * 2 * 2,
    })
    expect(bestand().floors).toBe(1)
    expect(bestand().resources).toEqual({ gold: 10, materials: 0 })
  })

  it('kauft in keiner anderen Phase als dem Tag', () => {
    expect(setPhase('night')).toBe(true)
    const vorher = bestand()
    expect(buyFloor(BALANCE)).toEqual({
      ok: false,
      reason: 'not-day-phase',
    })
    expect(bestand()).toEqual(vorher)
  })
})
