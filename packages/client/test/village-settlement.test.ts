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

afterEach(() => {
  resetDayNight()
})

describe('Dorfblick: Ableitung aus dem Phase-Owner', () => {
  it('zeigt im Tag den Dorfnamen, den laufenden Tag und die Startbasis', () => {
    resetDayNight()
    const outlook = villageOutlook()
    expect(outlook.name).toBe(fixture.village)
    expect(outlook.day).toBe(fixture.day)
    expect(outlook.districts).toHaveLength(3)
    expect(district('rathaus').note).toContain(String(fixture.workers))
  })

  it('leitet die Gilde aus Verletzungen ab, nicht aus einer eigenen Kopie', () => {
    resetDayNight()
    const outlook = villageOutlook()
    const injured = fixture.team.filter((hero) => hero.injury > 0).length
    const ready = fixture.team.length - injured
    expect(district('gilde').state).toBe(
      `${ready} von ${fixture.team.length} einsatzbereit`,
    )
    expect(outlook.roster).toBe(fixture.team)
  })

  it('zählt die belegten Verteidigerplätze aus dem Roster', () => {
    resetDayNight()
    const filled = fixture.monsterSlots.filter((slot) => slot.monsterId).length
    const pen = district('gehege')
    expect(pen.state).toBe(
      `${filled} von ${fixture.monsterSlots.length} Plätzen belegt`,
    )
    expect(pen.share).toBeCloseTo(filled / fixture.monsterSlots.length)
  })

  it('meldet vor dem ersten Auftrag eine offene Bilanz', () => {
    resetDayNight()
    expect(villageOutlook().lastNight.status).toBe('none')
    expect(district('rathaus').tone).toBe('accent')
  })

  it('übernimmt einen abgeschlossenen Auftrag in die Bilanz', () => {
    resetDayNight()
    startNight()
    triggerRaid()
    completeRaid(runLocalFixtureRaid(createDungeonGrid()))
    expect(villageOutlook().lastNight.status).toBe('completed')
    expect(district('rathaus').tone).toBe('idle')
  })

  it('markiert einen gescheiterten Auftrag als Warnung und behält den Tag', () => {
    resetDayNight()
    startNight()
    triggerRaid()
    completeRaid(runLocalFixtureRaid(blockedGrid()))
    const outlook = villageOutlook()
    expect(outlook.lastNight.status).toBe('failed')
    expect(district('rathaus').tone).toBe('alert')
    expect(outlook.day).toBe(fixture.day)
  })

  it('zählt den Tag nach dem Abschluss und löscht die Bilanz', () => {
    resetDayNight()
    startNight()
    triggerRaid()
    const job = runLocalFixtureRaid(createDungeonGrid())
    completeRaid(job)
    finishResult(job)
    expect(villageOutlook().day).toBe(fixture.day + 1)
    expect(villageOutlook().lastNight.status).toBe('none')
  })
})
