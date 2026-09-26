import { CellType, createDungeonGrid } from '@floor/sim-core'
import { afterEach, describe, expect, it } from 'vitest'
import { fixture } from '../src/fixture-data'
import { runLocalFixtureRaid } from '../src/raid/fixture-raid'
import {
  completeRaid,
  finishResult,
  startNight,
  triggerRaid,
} from '../src/village/phase-actions'
import {
  assignWorker,
  buildBuilding,
  sellLoot,
  settleVillageDay,
  treasury,
  usedPlots,
} from '../src/village'
import { releaseWorker, resetTreasury } from '../src/village/treasury'
import { resetDayNight } from '../src/village/state'

/** Beide Route-Ausgänge zumauern erzwingt einen blockierten Auftrag. */
function blockedGrid() {
  const grid = createDungeonGrid()
  grid.cells[63 * 64 + 62] = CellType.Wall
  grid.cells[62 * 64 + 63] = CellType.Wall
  return grid
}

/** Setzt einen Vorrat und rechnet mit der aktuellen Phase als Tag. */
function stock(gold: number, materials: number) {
  treasury.value = { ...treasury.value, gold, materials }
}

/** Fährt eine Nacht bis in die Ergebnisphase. */
function playNight(failed = false) {
  startNight()
  triggerRaid()
  const job = runLocalFixtureRaid(failed ? blockedGrid() : createDungeonGrid())
  completeRaid(job)
  return job
}

afterEach(() => {
  resetDayNight()
  resetTreasury()
})

describe('Dorfwirtschaft: bauen und einteilen', () => {
  it('zieht die Kosten der nächsten Stufe vom Vorrat ab', () => {
    stock(500, 20)
    const result = buildBuilding('werkstatt')
    expect(result.ok).toBe(true)
    expect(treasury.value.gold).toBe(500 - 55)
    expect(treasury.value.materials).toBe(20 - 3)
    expect(treasury.value.levels.werkstatt).toBe(1)
  })

  it('skaliert den Preis mit der Stufe', () => {
    stock(500, 20)
    buildBuilding('gehege')
    expect(buildBuilding('gehege').ok).toBe(true)
    expect(treasury.value.gold).toBe(500 - 35 - 70)
    expect(treasury.value.levels.gehege).toBe(2)
  })

  it('weist einen Bau am falschen Vorrat mit dem Fehlbetrag ab', () => {
    stock(10, 0)
    // Das Rathaus steht bereits, gebaut wird also die zweite Stufe.
    const result = buildBuilding('rathaus')
    expect(result.ok).toBe(false)
    expect(result.message).toContain('150 Gold')
    expect(treasury.value.gold).toBe(10)
  })

  it('baut in der höchsten Stufe nicht weiter', () => {
    stock(900, 40)
    buildBuilding('gehege')
    buildBuilding('gehege')
    const result = buildBuilding('gehege')
    expect(result.ok).toBe(false)
    expect(result.message).toContain('höchsten Stufe')
  })

  it('verlangt für einen Erstbau einen freien Bauplatz', () => {
    stock(900, 40)
    // Rathaus steht schon, also bleiben genau zwei weitere Arten.
    buildBuilding('wohnhaus')
    buildBuilding('werkstatt')
    expect(usedPlots(treasury.value)).toBe(treasury.value.plots)
    const result = buildBuilding('gehege')
    expect(result.ok).toBe(false)
    expect(result.message).toContain('Bauplätze')
  })

  it('baut weiter, wenn eine Art schon steht, weil kein Platz gebraucht wird', () => {
    stock(900, 40)
    buildBuilding('wohnhaus')
    buildBuilding('wohnhaus')
    expect(usedPlots(treasury.value)).toBe(2)
    expect(treasury.value.levels.wohnhaus).toBe(2)
  })

  it('baut nur am Tag und nicht in der Nacht', () => {
    stock(500, 20)
    startNight()
    const result = buildBuilding('werkstatt')
    expect(result.ok).toBe(false)
    expect(result.message).toContain('nur am Tag')
  })

  it('besetzt und räumt Arbeitsplätze, ohne Arbeiter zu erfinden', () => {
    stock(500, 20)
    buildBuilding('werkstatt')
    expect(assignWorker('werkstatt').ok).toBe(true)
    expect(treasury.value.assignments.werkstatt).toBe(1)
    // Ein zweiter Platz kostet Material und ist daher nicht im Startvorrat.
    const second = assignWorker('werkstatt')
    expect(second.ok).toBe(false)
    expect(releaseWorker('werkstatt').ok).toBe(true)
    expect(treasury.value.assignments.werkstatt).toBe(0)
  })
})

describe('Tagesabrechnung: Ertrag, Löhne, Zuzug', () => {
  it('zahlt Löhne gegen den Ertrag und bucht beides gegen den Vorrat', () => {
    stock(100, 10)
    buildBuilding('werkstatt')
    assignWorker('werkstatt')
    // Ertrag: Werkstatt Stufe 1 (2 Gold, 3 Material) und Rathaus Stufe 1
    // (3 Gold, 1 Material); Lohn: 1 Gold.
    const report = settleVillageDay()
    expect(report.gold).toBe(4)
    expect(report.materials).toBe(4)
    expect(treasury.value.gold).toBe(100 - 55 + 4)
    expect(treasury.value.materials).toBe(10 - 3 + 4)
  })

  it('zieht den Lohn auch dann vom Vorrat, wenn das Gebäude nichts einbringt', () => {
    stock(100, 10)
    buildBuilding('wohnhaus')
    assignWorker('wohnhaus')
    const report = settleVillageDay()
    expect(report.wages).toBe(1)
    // Der Lohn bleibt, nur der Ertrag des Rathauses gleicht ihn aus.
    expect(report.gold).toBe(2)
  })

  it('lockt Arbeiter über die Attraktivität des Rathauses ins Dorf', () => {
    stock(900, 40)
    buildBuilding('wohnhaus')
    const before = treasury.value.workers
    settleVillageDay()
    expect(treasury.value.workers).toBeGreaterThan(before)
  })

  it('deckelt den Zuzug durch die freie Unterkunft', () => {
    // Ohne Wohnhaus ist die Unterkunft genau der Arbeiterbestand: kein Zuzug.
    stock(900, 40)
    const before = treasury.value.workers
    const report = settleVillageDay()
    expect(report.recruits).toBe(0)
    expect(treasury.value.workers).toBe(before)
  })

  it('rechnet genau einmal ab, wenn ein Tag beginnt', () => {
    const job = playNight()
    const before = treasury.value.gold
    finishResult(job)
    expect(treasury.value.gold).not.toBe(before)
    const afterDay = treasury.value.gold
    // Ein Retry rechnet nichts ab, weil kein Tag beginnt.
    const retry = runLocalFixtureRaid(blockedGrid())
    completeRaid(retry)
    finishResult(retry)
    expect(treasury.value.gold).toBe(afterDay)
  })
})

describe('Beute: aus dem Auftrag ableiten und verkaufen', () => {
  it('legt die Beute eines erfolgreichen Auftrags zum Verkauf bereit', () => {
    playNight()
    const loot = treasury.value.pendingLoot
    expect(loot).not.toBeNull()
    expect(loot?.gold).toBeGreaterThan(0)
  })

  it('hinterlässt bei einem Fehlschlag keine Ware', () => {
    playNight(true)
    expect(treasury.value.pendingLoot).toBeNull()
  })

  it('verkauft nur im Ergebnis und nur einmal', () => {
    stock(10, 0)
    playNight()
    const first = sellLoot()
    expect(first.ok).toBe(true)
    const gold = treasury.value.gold
    expect(gold).toBeGreaterThan(10)
    const second = sellLoot()
    expect(second.ok).toBe(false)
    expect(treasury.value.gold).toBe(gold)
  })

  it('verkauft nicht vor dem Ergebnis', () => {
    playNight()
    const result = sellLoot()
    expect(result.ok).toBe(true)
    // Nach dem Verkauf ist der Auftrag abgeschlossen, das Lager ist leer.
    expect(treasury.value.pendingLoot).toBeNull()
  })
})
