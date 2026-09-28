import { describe, expect, it } from 'vitest'
import { BALANCE } from '../src/village/balance'
import {
  buildCost,
  canBuildWorkshop,
  dailyYield,
  floorCost,
  landStepCost,
  slotCost,
  upgradeCost,
  workerBase,
  workshopYield,
} from '../src/village/economy'

/**
 * Die Wächter an der Eingabeseite der Dorfregeln.
 *
 * Ein Bereichsvergleich allein genügt nicht: `NaN` ist weder kleiner noch
 * größer als eine Grenze, fällt also durch jedes `x < n` hindurch, und eine
 * gebrochene Zahl nähme einen nicht ganzen Betrag an. Diese Datei fährt genau
 * diese Eingaben gegen jede Preisfunktion und nennt dabei den erwarteten
 * Ablehnungsgrund — ein `ok: false` ohne Grund würde auch ein falscher Grund
 * erfüllen.
 */

/** Eingaben, die keine Ganzzahl ab 1 sind und darum keine Stufe, Etage, kein Platz sind. */
const UNGUELTIG = [Number.NaN, Number.POSITIVE_INFINITY, 2.5, -1] as const

const ERSTE_ETAGE = BALANCE.dungeon.firstPaidFloor

/** Das Land nach genau einem Schritt — aus der Config, nicht als Zahl hier. */
const ZIEL = BALANCE.start.landColumns + BALANCE.land.columnsPerStep

describe('Preisfunktionen weisen unbrauchbare Stufen ab', () => {
  it('weisen NaN, Unendlichkeit, eine gebrochene und eine negative Stufe ab', () => {
    for (const stufe of UNGUELTIG) {
      expect(upgradeCost('house', stufe, BALANCE)).toEqual({
        ok: false,
        reason: 'below-first-level',
      })
    }
  })

  it('weisen dieselben vier Eingaben auch als Etage ab', () => {
    for (const etage of UNGUELTIG) {
      expect(floorCost(etage, BALANCE)).toEqual({
        ok: false,
        reason: 'below-first-paid-floor',
        firstPaidFloor: ERSTE_ETAGE,
      })
    }
  })

  it('weisen dieselben vier Eingaben auch als Etage des Platzpreises ab', () => {
    for (const etage of UNGUELTIG) {
      expect(slotCost(etage, 1, BALANCE)).toEqual({
        ok: false,
        reason: 'below-first-paid-floor',
        firstPaidFloor: ERSTE_ETAGE,
      })
    }
  })

  it('weisen dieselben vier Eingaben auch als Platznummer ab', () => {
    for (const platz of UNGUELTIG) {
      expect(slotCost(ERSTE_ETAGE, platz, BALANCE)).toEqual({
        ok: false,
        reason: 'slot-out-of-range',
        slotsPerFloor: BALANCE.dungeon.slotsPerFloor,
      })
    }
  })
})

describe('Die Landerweiterung beginnt bei der Breite, die das Dorf hat', () => {
  it('weist eine Ausgangsbreite vor dem Ausgang ab', () => {
    for (const von of [0, -2, BALANCE.start.landColumns - 1]) {
      expect(landStepCost(von, ZIEL, BALANCE)).toEqual({
        ok: false,
        reason: 'below-start-columns',
        landColumns: BALANCE.start.landColumns,
      })
    }
  })

  it('weist eine nicht ganze Ausgangsbreite ab, auch unendliche', () => {
    const gebrochen = BALANCE.start.landColumns + 0.5
    for (const von of [gebrochen, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(landStepCost(von, ZIEL, BALANCE)).toEqual({
        ok: false,
        reason: 'below-start-columns',
        landColumns: BALANCE.start.landColumns,
      })
    }
  })

  it('nimmt den Ausgang selbst noch an', () => {
    expect(landStepCost(BALANCE.start.landColumns, ZIEL, BALANCE).ok).toBe(true)
  })
})

describe('Der Werkstattertrag fängt eine kaputte Stufe als 0 ab', () => {
  it('liefert für Stufe 0, minus 1, eine gebrochene und NaN nichts', () => {
    for (const stufe of [0, -1, 2.5, Number.NaN]) {
      expect(workshopYield(stufe, BALANCE)).toBe(0)
    }
  })

  it('rechnet eine kaputte Stufe in der Dorfsumme auf keinen Fehler', () => {
    const dorf = [
      { kind: 'workshop' as const, level: Number.NaN },
      { kind: 'workshop' as const, level: -1 },
      { kind: 'workshop' as const, level: 1 },
    ]
    expect(dailyYield(dorf, BALANCE)).toBe(workshopYield(1, BALANCE))
  })
})

describe('Die Arbeiterbasis wächst nur mit einer echten Stufe', () => {
  it('lässt ein Wohnhaus ohne brauchbare Stufe ohne Beitrag', () => {
    for (const stufe of [-10, 0, 1.5, Number.NaN]) {
      const dorf = [{ kind: 'house' as const, level: stufe }]
      expect(workerBase(dorf, BALANCE)).toBe(BALANCE.start.workerBase)
    }
  })

  it('hält die Kapazität auch mit kaputten Wohnhäusern über null', () => {
    const dorf = [
      { kind: 'house' as const, level: -10 },
      { kind: 'workshop' as const, level: 1 },
    ]
    const ablehnung = canBuildWorkshop(dorf, BALANCE)
    expect(ablehnung.ok).toBe(true)
    expect(
      Math.floor(BALANCE.start.workerBase / BALANCE.workers.capacityDivisor),
    ).toBeGreaterThan(0)
  })
})

describe('Der Baupreis ist eine Kopie und kein Schreibziel', () => {
  it('gibt eine eigene Kopie heraus, an der der Aufrufer drehen darf', () => {
    const preis = buildCost('workshop', BALANCE)
    expect(preis).toEqual(BALANCE.buildings.workshop.buildCost)
    expect(preis).not.toBe(BALANCE.buildings.workshop.buildCost)
    expect(() => {
      preis.gold = 0
    }).not.toThrow()
    expect(BALANCE.buildings.workshop.buildCost.gold).toBeGreaterThan(0)
  })
})

describe('Die freigegebenen Werte stehen fest', () => {
  it('liefert den Ertrag der Stufe 5 aus der Freigabetabelle', () => {
    expect(workshopYield(5, BALANCE)).toBe(11)
  })

  it('liefert die Ertragskurve der ganzen Werkstattleiste', () => {
    const ertrag = [1, 2, 3, 4, 5].map((stufe) => workshopYield(stufe, BALANCE))
    expect(ertrag).toEqual([3, 5, 7, 9, 11])
  })

  it('liefert die Summe der fünf Plätze der Etage 2 aus der Freigabetabelle', () => {
    const plaetze = Array.from(
      { length: BALANCE.dungeon.slotsPerFloor },
      (_, i) => slotCost(2, i + 1, BALANCE),
    ).map((ergebnis) => (ergebnis.ok ? ergebnis.cost : Number.NaN))
    expect(plaetze).toEqual([160, 320, 480, 640, 800])
    expect(plaetze.reduce((sum, betrag) => sum + betrag)).toBe(2400)
  })
})
