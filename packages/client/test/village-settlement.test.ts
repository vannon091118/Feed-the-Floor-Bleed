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
import { villageOutlook } from '../src/village/settlement'
import { resetDayNight } from '../src/village/state'
import { buildBuilding, resetTreasury, treasury } from '../src/village/treasury'

/** Beide Route-Ausgänge zumauern erzwingt einen blockierten Auftrag. */
function blockedGrid() {
  const grid = createDungeonGrid()
  grid.cells[63 * 64 + 62] = CellType.Wall
  grid.cells[62 * 64 + 63] = CellType.Wall
  return grid
}

function district(id: string) {
  const found = villageOutlook().districts.find((entry) => entry.id === id)
  if (!found) throw new Error(`Gebiet ${id} fehlt im Dorfblick`)
  return found
}

/** Legt einen Vorrat an, der für jeden Bau reicht. */
function stock(gold: number, materials: number) {
  treasury.value = { ...treasury.value, gold, materials }
}

afterEach(() => {
  resetDayNight()
  resetTreasury()
})

describe('Dorfblick: Ableitung aus Wirtschaft und Phase', () => {
  it('zeigt im Tag Dorfnamen, laufenden Tag und den Wirtschaftsstand', () => {
    const outlook = villageOutlook()
    expect(outlook.name).toBe(fixture.village)
    expect(outlook.day).toBe(fixture.day)
    expect(outlook.districts).toHaveLength(3)
    expect(outlook.gold).toBe(fixture.resources.gold)
    expect(outlook.workers).toBe(fixture.workers)
  })

  it('folgt einem Ausbau, statt bei einer Konstante stehen zu bleiben', () => {
    stock(500, 20)
    expect(buildBuilding('werkstatt').ok).toBe(true)
    const outlook = villageOutlook()
    expect(outlook.gold).toBe(500 - 55)
    expect(outlook.buildings.find((b) => b.id === 'werkstatt')?.level).toBe(1)
  })

  it('leitet die Gilde aus Verletzungen und freien Arbeitern ab', () => {
    const ready = fixture.team.filter((hero) => hero.injury === 0).length
    expect(district('gilde').state).toBe(
      `${ready} von ${fixture.team.length} einsatzbereit`,
    )
    expect(district('gilde').note).toContain(`${fixture.workers} Arbeiter frei`)
  })

  it('zählt die belegten Verteidigerplätze aus dem Roster', () => {
    const filled = fixture.monsterSlots.filter((slot) => slot.monsterId).length
    const pen = district('gehege')
    expect(pen.state).toBe(
      `${filled} von ${fixture.monsterSlots.length} Plätzen belegt`,
    )
    expect(pen.share).toBeCloseTo(filled / fixture.monsterSlots.length)
  })

  it('meldet vor dem ersten Auftrag eine offene Bilanz', () => {
    expect(villageOutlook().lastNight.status).toBe('none')
    expect(district('rathaus').tone).toBe('accent')
  })

  it('übernimmt einen abgeschlossenen Auftrag in die Bilanz', () => {
    startNight()
    triggerRaid()
    completeRaid(runLocalFixtureRaid(createDungeonGrid()))
    expect(villageOutlook().lastNight.status).toBe('completed')
  })

  it('markiert einen gescheiterten Auftrag als Warnung', () => {
    startNight()
    triggerRaid()
    completeRaid(runLocalFixtureRaid(blockedGrid()))
    expect(villageOutlook().lastNight.status).toBe('failed')
    expect(district('rathaus').tone).toBe('alert')
  })

  it('zählt den Tag nach dem Abschluss und löscht die Bilanz', () => {
    startNight()
    triggerRaid()
    const job = runLocalFixtureRaid(createDungeonGrid())
    completeRaid(job)
    finishResult(job)
    expect(villageOutlook().day).toBe(fixture.day + 1)
    expect(villageOutlook().lastNight.status).toBe('none')
  })
})
