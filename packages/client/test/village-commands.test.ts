import { afterEach, describe, expect, it } from 'vitest'
import {
  BALANCE,
  type BuildingKind,
  type FrozenBalance,
} from '../src/village/balance'
import {
  buildBuilding,
  extendLand,
  upgradeBuilding,
} from '../src/village/commands'
import { buildCost } from '../src/village/economy'
import {
  dayNight,
  resetDayNight,
  setPhase,
  type VillageHoldings,
} from '../src/village/state'

/**
 * Die drei Kommandos des Dorfes: Bauen, Ausbauen, Land kaufen.
 *
 * Geprüft wird nach jedem Befehl der Bestand und nicht nur das Ergebnis: Ein
 * Kommando, das `ok: false` meldet und trotzdem abbucht, wäre sonst grün. Die
 * Satzgrenzen (Deckung, Raster, Kapazität, Preis) stehen hier, die
 * Bestandsinvarianten in `village-command-guards.test.ts`.
 */

/** Ein gestellter Bestand; die Testfigur ersetzt die Freigabetabelle. */
function mitBestand(gold: number, materials: number): void {
  dayNight.value = {
    ...dayNight.value,
    village: {
      ...dayNight.value.village,
      resources: { gold, materials },
    },
  }
}

/** Ein stehendes Gebäude ohne Bauvorgang. Nur für den Startzustand eines Tests. */
function mitGebaeude(kind: BuildingKind, level: number, x = 0, y = 0): void {
  dayNight.value = {
    ...dayNight.value,
    village: {
      ...dayNight.value.village,
      buildings: [{ kind, level, footprint: { x, y, width: 2, height: 3 } }],
    },
  }
}

/**
 * Die beiden festen Startorte stehen in jedem Bestand vor dem Gebauten.
 *
 * Der Wert kommt aus der Config, damit eine freigegebene Zelle hier nicht als
 * zweite Zahl steht; die Stellen der neu gebauten Gebäude liegen dahinter und
 * werden deshalb relativ zu dieser Zahl gezählt.
 */
const FESTE_ORTE = BALANCE.start.fixedSites.length

function bestand(): VillageHoldings {
  return dayNight.value.village
}

afterEach(() => {
  resetDayNight()
})

describe('Bauen', () => {
  it('baut an eine freie Zelle und zieht genau den Preis ab', () => {
    const vorher = bestand().resources
    const ergebnis = buildBuilding('house', { x: 4, y: 4 }, BALANCE)

    expect(ergebnis.ok && ergebnis.building.level).toBe(1)
    expect(ergebnis.ok && ergebnis.building.footprint).toEqual({
      x: 4,
      y: 4,
      width: BALANCE.buildings.house.footprint.width,
      height: BALANCE.buildings.house.footprint.height,
    })
    expect(bestand().buildings).toHaveLength(FESTE_ORTE + 1)
    expect(bestand().resources.gold).toBe(
      vorher.gold - BALANCE.buildings.house.buildCost.gold,
    )
    expect(bestand().resources.materials).toBe(
      vorher.materials - BALANCE.buildings.house.buildCost.materials,
    )
  })

  it('baut in keiner anderen Phase als dem Tag', () => {
    const vorher = bestand()
    for (const phase of ['night', 'raid', 'result'] as const) {
      expect(setPhase(phase)).toBe(true)
      expect(buildBuilding('workshop', { x: 0, y: 0 }, BALANCE)).toEqual({
        ok: false,
        reason: 'not-day-phase',
      })
      expect(bestand()).toEqual(vorher)
    }
  })

  it('nennt den Preis, wenn der Bestand nicht reicht', () => {
    mitBestand(1, 1)
    expect(buildBuilding('workshop', { x: 0, y: 0 }, BALANCE)).toEqual({
      ok: false,
      reason: 'not-affordable',
      cost: buildCost('workshop', BALANCE),
    })
    expect(bestand().resources).toEqual({ gold: 1, materials: 1 })
    expect(bestand().buildings).toHaveLength(FESTE_ORTE)
  })

  it('baut nicht über eine belegte Zelle', () => {
    expect(buildBuilding('house', { x: 0, y: 0 }, BALANCE).ok).toBe(true)
    const nach = bestand().resources

    const ergebnis = buildBuilding('house', { x: 1, y: 1 }, BALANCE)
    expect(ergebnis.ok === false && ergebnis.reason).toBe('overlaps')
    expect(bestand().resources).toEqual(nach)
    expect(bestand().buildings).toHaveLength(FESTE_ORTE + 1)
  })

  it('lässt Randberührung zu und weist die Randauslage ab', () => {
    // Der Startbestand trägt nur vier Material für ein Haus; zwei brauchen acht.
    // Die festen Startorte belegen die mittleren Spalten, die freie Fläche liegt
    // rechts davon: Zwei aneinanderstoßende Grundrisse bleiben trotzdem gültig.
    mitBestand(BALANCE.start.resources.gold, 20)
    expect(buildBuilding('house', { x: 6, y: 0 }, BALANCE).ok).toBe(true)
    expect(buildBuilding('house', { x: 8, y: 0 }, BALANCE).ok).toBe(true)

    expect(buildBuilding('house', { x: 9, y: 9 }, BALANCE)).toEqual({
      ok: false,
      reason: 'out-of-bounds',
    })
    expect(bestand().buildings).toHaveLength(FESTE_ORTE + 2)
  })

  it('baut nicht auf eine Lage, die keine Rasterzelle ist', () => {
    for (const site of [
      { x: 1.5, y: 0 },
      { x: Number.NaN, y: 0 },
    ]) {
      expect(buildBuilding('house', site, BALANCE)).toEqual({
        ok: false,
        reason: 'not-a-cell',
      })
    }
    expect(bestand().buildings).toHaveLength(FESTE_ORTE)
  })

  it('achtet die Arbeiterkapazität des Dorfes', () => {
    const knapp: FrozenBalance = {
      ...BALANCE,
      start: { ...BALANCE.start, workerBase: 2 },
    }
    mitBestand(400, 40)
    expect(buildBuilding('workshop', { x: 0, y: 0 }, knapp).ok).toBe(true)

    expect(buildBuilding('workshop', { x: 4, y: 0 }, knapp)).toEqual({
      ok: false,
      reason: 'worker-capacity',
      capacity: 1,
    })
    expect(bestand().buildings).toHaveLength(FESTE_ORTE + 1)
  })
})

describe('Ausbauen', () => {
  it('hebt um eine Stufe und zieht genau den Ausbaupreis ab', () => {
    expect(buildBuilding('house', { x: 0, y: 0 }, BALANCE).ok).toBe(true)
    const nachBau = bestand().resources.gold
    const ausbau = BALANCE.buildings.house.upgradeCoefficient * 2 * 2

    // Die beiden festen Startorte stehen in der Liste vor dem neuen Haus.
    const stelle = bestand().buildings.length - 1
    const ergebnis = upgradeBuilding(stelle, BALANCE)
    expect(ergebnis.ok && ergebnis.building.level).toBe(2)
    expect(bestand().resources.gold).toBe(nachBau - ausbau)
    expect(bestand().buildings).toHaveLength(FESTE_ORTE + 1)
  })

  it('hebt nicht über die letzte Stufe', () => {
    mitGebaeude('workshop', BALANCE.buildings.workshop.maxLevel)
    mitBestand(1000, 100)
    expect(upgradeBuilding(0, BALANCE)).toEqual({
      ok: false,
      reason: 'above-max-level',
      maxLevel: BALANCE.buildings.workshop.maxLevel,
    })
    expect(bestand().buildings[0].level).toBe(
      BALANCE.buildings.workshop.maxLevel,
    )
    expect(bestand().resources).toEqual({ gold: 1000, materials: 100 })
  })

  it('hebt nicht ohne Gold', () => {
    mitGebaeude('house', 1)
    mitBestand(1, 0)
    expect(upgradeBuilding(0, BALANCE)).toEqual({
      ok: false,
      reason: 'not-affordable',
      cost: BALANCE.buildings.house.upgradeCoefficient * 4,
    })
    expect(bestand().buildings[0].level).toBe(1)
  })
})

describe('Land kaufen', () => {
  it('kauft einen Schritt und lässt die Höhe des Rasters stehen', () => {
    const vorher = bestand()

    expect(extendLand(BALANCE).ok).toBe(true)
    expect(bestand().landColumns).toBe(
      vorher.landColumns + BALANCE.land.columnsPerStep,
    )
    expect(bestand().resources.gold).toBe(
      vorher.resources.gold - BALANCE.land.goldCoefficient,
    )
    expect(bestand().resources.materials).toBe(
      vorher.resources.materials - BALANCE.land.materialCoefficient,
    )
  })

  it('kauft keinen Schritt ohne Deckung', () => {
    mitBestand(10, 0)
    expect(extendLand(BALANCE)).toEqual({
      ok: false,
      reason: 'not-affordable',
      cost: {
        gold: BALANCE.land.goldCoefficient,
        materials: BALANCE.land.materialCoefficient,
      },
    })
    expect(bestand().landColumns).toBe(BALANCE.start.landColumns)
    expect(bestand().resources).toEqual({ gold: 10, materials: 0 })
  })
})
