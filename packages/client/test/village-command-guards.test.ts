import { afterEach, describe, expect, it } from 'vitest'
import { fixture } from '../src/fixture-data'
import { BALANCE } from '../src/village/balance'
import { buildBuilding, upgradeBuilding } from '../src/village/commands'
import { workshopYield } from '../src/village/economy'
import {
  completeRaid,
  finishResult,
  startNight,
  triggerRaid,
} from '../src/village/phase-actions'
import {
  commitVillage,
  dayNight,
  resetDayNight,
  setPhase,
  type VillageHoldings,
} from '../src/village/state'
import { JOB } from './raid-fixtures'

/**
 * Die Zusagen, die für jeden Schreibzugriff auf den Dorfbestand gelten.
 *
 * Der Store nimmt einen fertig gerechneten Bestand entgegen und hält selbst
 * dagegen: nur am Tag, kein negativer und kein gebrochener Betrag, kein Raster
 * unter der Startbreite. Diese Datei fährt genau diese Eingaben gegen ihn und
 * prüft danach, dass ein abgelehnter Befehl nichts hinterlässt.
 */

function bestand(): VillageHoldings {
  return dayNight.value.village
}

afterEach(() => {
  resetDayNight()
})

describe('Der Bestand bleibt ganzzahlig und nicht negativ', () => {
  it('weist einen negativen, gebrochenen oder verkleinerten Bestand ab', () => {
    const vorher = bestand()
    const kaputt: VillageHoldings[] = [
      { ...vorher, resources: { gold: -1, materials: 0 } },
      { ...vorher, resources: { gold: 0, materials: -1 } },
      { ...vorher, resources: { gold: Number.NaN, materials: 0 } },
      { ...vorher, resources: { gold: 1.5, materials: 0 } },
      { ...vorher, landColumns: BALANCE.start.landColumns - 2 },
      { ...vorher, landColumns: 11.5 },
    ]
    for (const eingabe of kaputt) {
      expect(commitVillage(eingabe)).toBe(false)
      expect(bestand()).toEqual(vorher)
    }
  })

  it('schreibt außerhalb des Tages gar nichts', () => {
    const vorher = bestand()
    expect(setPhase('night')).toBe(true)
    const reich: VillageHoldings = {
      ...vorher,
      resources: { gold: 999, materials: 999 },
    }
    expect(commitVillage(reich)).toBe(false)
    expect(bestand()).toEqual(vorher)
  })

  it('weist eine Ausbaustelle ab, an der nichts steht', () => {
    expect(upgradeBuilding(0, BALANCE)).toEqual({
      ok: false,
      reason: 'unknown-building',
      index: 0,
    })
    expect(bestand().resources).toEqual(BALANCE.start.resources)
  })

  it('lässt den Bestand nach jedem abgelehnten Befehl unverändert', () => {
    const befehle = [
      () => buildBuilding('hall', { x: 0, y: 0 }, BALANCE),
      () => buildBuilding('house', { x: -1, y: 0 }, BALANCE),
      () => buildBuilding('house', { x: 0.5, y: 0 }, BALANCE),
      () => upgradeBuilding(3, BALANCE),
      () => upgradeBuilding(-1, BALANCE),
    ]
    const vorher = bestand()
    for (const befehl of befehle) {
      expect(befehl().ok).toBe(false)
      expect(bestand()).toEqual(vorher)
      expect(Number.isInteger(bestand().resources.gold)).toBe(true)
      expect(bestand().resources.gold).toBeGreaterThanOrEqual(0)
      expect(bestand().resources.materials).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('Gebautes Dorf und Tagesabrechnung', () => {
  it('zahlt am nächsten Morgen den Ertrag der gebauten Werkstatt', () => {
    expect(buildBuilding('workshop', { x: 0, y: 0 }, BALANCE).ok).toBe(true)
    const nachBau = bestand().resources

    expect(startNight()).toBe(true)
    expect(triggerRaid()).toBe(true)
    expect(completeRaid(JOB)).toBe(true)
    expect(finishResult(JOB)).toBe(true)

    expect(dayNight.value.phase).toBe('tag')
    expect(dayNight.value.day).toBe(fixture.day + 1)
    expect(bestand().resources.materials).toBe(
      nachBau.materials + workshopYield(1, BALANCE),
    )
    expect(bestand().buildings).toHaveLength(1)
  })

  it('bucht den Bau nicht erneut, wenn der Tag zweimal schließt', () => {
    expect(buildBuilding('house', { x: 0, y: 0 }, BALANCE).ok).toBe(true)
    const nachBau = bestand().resources

    expect(setPhase('night')).toBe(true)
    expect(setPhase('raid')).toBe(true)
    expect(setPhase('result')).toBe(true)
    expect(setPhase('tag')).toBe(true)
    // Ein zweiter Abschluss derselben Rückkehr ist kein Übergang mehr.
    expect(setPhase('tag')).toBe(false)
    expect(bestand().resources.gold).toBe(nachBau.gold)
    expect(bestand().resources.materials).toBe(nachBau.materials)
  })
})
