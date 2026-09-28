import { describe, expect, it } from 'vitest'
import { BALANCE, type Cost } from '../src/village/balance'
import {
  buildCost,
  canBuildWorkshop,
  dailyYield,
  floorCost,
  landStepCost,
  type PlacedBuilding,
  slotCost,
  upgradeCost,
  workerBase,
  workshopYield,
} from '../src/village/economy'

/** Alle Zahlen aus bejaheten Kostenfunktionen, Skalarbetrag oder Gold+Material. */
function betraege(
  ergebnisse: readonly { ok: boolean; cost?: number | Cost }[],
): number[] {
  return ergebnisse.flatMap((ergebnis) => {
    if (!ergebnis.ok || ergebnis.cost === undefined) return []
    return typeof ergebnis.cost === 'number'
      ? [ergebnis.cost]
      : [ergebnis.cost.gold, ergebnis.cost.materials]
  })
}

/** Dieselben Beträge je Währung getrennt — Gold und Material wachsen einzeln. */
function reihen(ergebnisse: readonly { ok: boolean; cost?: Cost }[]): {
  gold: number[]
  materials: number[]
} {
  const gold: number[] = []
  const materials: number[] = []
  for (const ergebnis of ergebnisse) {
    if (!ergebnis.ok || ergebnis.cost === undefined) continue
    gold.push(ergebnis.cost.gold)
    materials.push(ergebnis.cost.materials)
  }
  return { gold, materials }
}

/** Wächst die Liste streng? Jeder Wert muss größer sein als sein Vorgänger. */
function waechst(liste: readonly number[]): boolean {
  return liste.every((wert, index) => index === 0 || wert > liste[index - 1])
}

/** Nie negativ, nie gebrochen, nie NaN — die drei Fehler einer Preisfunktion. */
function istGeldbetrag(liste: readonly number[]): boolean {
  return liste.every(
    (wert) => !Number.isNaN(wert) && Number.isInteger(wert) && wert >= 0,
  )
}

const WERKSTATTEN = (anzahl: number, stufe = 1): PlacedBuilding[] =>
  Array.from({ length: anzahl }, () => ({
    kind: 'workshop' as const,
    level: stufe,
  }))

describe('Startbestand aus der freigegebenen Balance', () => {
  it('macht die erste Werkstatt mit dem Startbestand bezahlbar', () => {
    const preis = buildCost('workshop', BALANCE)
    expect(preis.gold).toBeLessThanOrEqual(BALANCE.start.resources.gold)
    expect(preis.materials).toBeLessThanOrEqual(
      BALANCE.start.resources.materials,
    )
  })

  it('ist bis in die Gruppen eingefroren, damit keine Regel zur Laufzeit abweicht', () => {
    expect(Object.isFrozen(BALANCE)).toBe(true)
    expect(Object.isFrozen(BALANCE.buildings.workshop)).toBe(true)
    expect(Object.isFrozen(BALANCE.start.resources)).toBe(true)
  })
})

describe('Kostenfunktionen', () => {
  it('wachsen streng mit der Stufe, der Etage und dem Land-Schritt', () => {
    const stufen = [1, 2, 3, 4, 5]
    for (const art of ['house', 'workshop'] as const) {
      expect(
        waechst(betraege(stufen.map((n) => upgradeCost(art, n, BALANCE)))),
      ).toBe(true)
    }
    expect(
      waechst(betraege([2, 3, 4, 5].map((n) => floorCost(n, BALANCE)))),
    ).toBe(true)
    expect(
      waechst(betraege([2, 3, 4].map((n) => slotCost(n, 1, BALANCE)))),
    ).toBe(true)
    expect(
      waechst(betraege([2, 3, 4].map((n) => slotCost(2, n, BALANCE)))),
    ).toBe(true)
    const schritte = reihen(
      [1, 2, 3, 4].map((n) => landStepCost(10, 10 + n * 2, BALANCE)),
    )
    expect(waechst(schritte.gold)).toBe(true)
    expect(waechst(schritte.materials)).toBe(true)
  })

  it('liefern in ihrem Wertebereich nie etwas anderes als ganze Beträge', () => {
    const alles = [
      ...betraege(
        [1, 2, 3, 4, 5].map((n) => upgradeCost('workshop', n, BALANCE)),
      ),
      ...betraege([1, 2, 3, 4, 5].map((n) => upgradeCost('house', n, BALANCE))),
      ...betraege([2, 3, 4, 5, 6].map((n) => floorCost(n, BALANCE))),
      ...[2, 3, 4].flatMap((n) =>
        betraege([1, 2, 3, 4, 5].map((s) => slotCost(n, s, BALANCE))),
      ),
      ...betraege(
        [1, 2, 3, 4].map((n) => landStepCost(10, 10 + n * 2, BALANCE)),
      ),
      ...[1, 2, 3, 4, 5].map((n) => workshopYield(n, BALANCE)),
    ]
    expect(alles.length).toBeGreaterThan(0)
    expect(istGeldbetrag(alles)).toBe(true)
  })
})

describe('Grenzen der Regeln', () => {
  it('weisen eine Zielstufe über dem Maximum ab', () => {
    const hoechste = BALANCE.buildings.workshop.maxLevel
    expect(upgradeCost('workshop', hoechste, BALANCE).ok).toBe(true)
    expect(upgradeCost('workshop', hoechste + 1, BALANCE)).toEqual({
      ok: false,
      reason: 'above-max-level',
      maxLevel: hoechste,
    })
    expect(upgradeCost('workshop', 0, BALANCE)).toEqual({
      ok: false,
      reason: 'below-first-level',
    })
  })

  it('weisen Etagen unterhalb der ersten kaufbaren ab', () => {
    for (const etage of [0, 1]) {
      expect(floorCost(etage, BALANCE)).toEqual({
        ok: false,
        reason: 'below-first-paid-floor',
        firstPaidFloor: BALANCE.dungeon.firstPaidFloor,
      })
      expect(slotCost(etage, 1, BALANCE).ok).toBe(false)
    }
  })

  it('weisen Plätze unterhalb von eins und oberhalb der Kapazität ab', () => {
    const grenze = BALANCE.dungeon.firstPaidFloor
    for (const platz of [0, -1, BALANCE.dungeon.slotsPerFloor + 1]) {
      expect(slotCost(grenze, platz, BALANCE)).toEqual({
        ok: false,
        reason: 'slot-out-of-range',
        slotsPerFloor: BALANCE.dungeon.slotsPerFloor,
      })
    }
    expect(slotCost(grenze, 1, BALANCE).ok).toBe(true)
    expect(slotCost(grenze, BALANCE.dungeon.slotsPerFloor, BALANCE).ok).toBe(
      true,
    )
  })

  it('weisen eine Landerweiterung ab, die das Land nicht breiter macht', () => {
    for (const ziel of [10, 8]) {
      expect(landStepCost(10, ziel, BALANCE)).toEqual({
        ok: false,
        reason: 'not-wider',
      })
    }
    expect(landStepCost(10, 11, BALANCE)).toEqual({
      ok: false,
      reason: 'not-a-whole-step',
      columnsPerStep: BALANCE.land.columnsPerStep,
    })
  })

  it('weisen die Werkstatt hinter der Arbeiterkapazität ab', () => {
    const kapazitaet = Math.floor(
      BALANCE.start.workerBase / BALANCE.workers.capacityDivisor,
    )
    expect(canBuildWorkshop(WERKSTATTEN(kapazitaet - 1), BALANCE)).toEqual({
      ok: true,
    })
    expect(canBuildWorkshop(WERKSTATTEN(kapazitaet), BALANCE)).toEqual({
      ok: false,
      reason: 'worker-capacity',
      capacity: kapazitaet,
    })
    // Ein Wohnhaus hebt die Arbeiterbasis und damit die Kapazität wieder an.
    const mitHaus = [
      ...WERKSTATTEN(kapazitaet),
      { kind: 'house' as const, level: 1 },
    ]
    expect(workerBase(mitHaus, BALANCE)).toBeGreaterThan(
      BALANCE.start.workerBase,
    )
    expect(canBuildWorkshop(mitHaus, BALANCE)).toEqual({ ok: true })
  })
})

describe('Werkstattertrag', () => {
  it('liefert für ein Dorf ohne Werkstätten null statt eines Fehlers', () => {
    expect(dailyYield([], BALANCE)).toBe(0)
    expect(dailyYield([{ kind: 'house', level: 3 }], BALANCE)).toBe(0)
  })

  it('summiert die Erträge mehrerer Werkstätten und Häuser getrennt', () => {
    const dorf: PlacedBuilding[] = [
      { kind: 'workshop', level: 1 },
      { kind: 'workshop', level: 3 },
      { kind: 'house', level: 2 },
    ]
    expect(dailyYield(dorf, BALANCE)).toBe(
      workshopYield(1, BALANCE) + workshopYield(3, BALANCE),
    )
  })
})
