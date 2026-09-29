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
 *
 * Dazu gehören seit dem 2026-09-29 die beiden festen Startorte: Sie liegen im
 * selben Bestand wie alles Gebaute, und die Platzierungsprüfung schützt sie
 * deshalb, ohne dass ein Kommando die festen Orte eigens kennt.
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
      { ...vorher, floors: 0 },
      { ...vorher, floors: 1.5 },
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
    // Die festen Startorte belegen die ersten Stellen der Liste; die erste
    // freie Stelle liegt dahinter.
    const leer = bestand().buildings.length
    expect(upgradeBuilding(leer, BALANCE)).toEqual({
      ok: false,
      reason: 'unknown-building',
      index: leer,
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

describe('Feste Startorte des Dorfes', () => {
  it('legt Rathaus und Gilde an den freigegebenen Zellen an', () => {
    // Absolute Werte und keine Ableitung aus der Config: Die Zellen sind
    // freigegeben, eine verschobene Zahl muss hier auffallen und nicht erst
    // daran, dass ein Baukommando etwas anderes als belegt ansieht.
    expect(bestand().buildings).toEqual([
      {
        kind: 'hall',
        level: 1,
        footprint: { x: 3, y: 1, width: 3, height: 3 },
      },
      {
        kind: 'guild',
        level: 1,
        footprint: { x: 3, y: 6, width: 3, height: 3 },
      },
    ])
  })

  it('lässt sich nicht ein zweites Mal bauen, auch nicht auf freiem Raster', () => {
    // Die Zelle liegt frei und im Raster: Die Ablehnung kann deshalb nur an
    // der Art hängen und nicht an der Geometrie.
    const vorher = bestand()
    for (const kind of ['hall', 'guild'] as const) {
      expect(buildBuilding(kind, { x: 7, y: 0 }, BALANCE)).toEqual({
        ok: false,
        reason: 'not-buildable',
      })
    }
    expect(bestand()).toEqual(vorher)
  })

  it('weist eine Baustelle auf einem festen Startort ab', () => {
    const vorher = bestand()

    expect(buildBuilding('house', { x: 3, y: 1 }, BALANCE)).toEqual({
      ok: false,
      reason: 'overlaps',
      conflict: { x: 3, y: 1, width: 3, height: 3 },
    })
    expect(buildBuilding('house', { x: 5, y: 6 }, BALANCE)).toEqual({
      ok: false,
      reason: 'overlaps',
      conflict: { x: 3, y: 6, width: 3, height: 3 },
    })
    expect(bestand()).toEqual(vorher)
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
    expect(bestand().buildings).toHaveLength(
      BALANCE.start.fixedSites.length + 1,
    )
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
