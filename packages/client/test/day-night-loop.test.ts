import { RaidJobSchema } from '@floor/contracts'
import { CellType, createDungeonGrid } from '@floor/sim-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fixture } from '../src/fixture-data'
import { runLocalFixtureRaid } from '../src/raid/fixture-raid'
import {
  completeRaid,
  finishResult,
  startNight,
  triggerRaid,
} from '../src/village/phase-actions'
import { dayNight, resetDayNight } from '../src/village/state'

/**
 * Fake-Timer decken nur Timer ab, die Uhr bleibt real messbar. Der Loop
 * besteht damit ausschließlich aus synchronen Zustandswechseln und
 * Core-Läufen; ein versteckter Real-Time-Timeout würde als Timer-Zähler
 * sichtbar werden.
 */
vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

const BUDGET_MS = 5000

/** Beide Route-Ausgänge zumauern erzwingt einen blockierten Auftrag. */
function blockedGrid() {
  const grid = createDungeonGrid()
  grid.cells[63 * 64 + 62] = CellType.Wall
  grid.cells[62 * 64 + 63] = CellType.Wall
  return grid
}

afterEach(() => {
  expect(vi.getTimerCount()).toBe(0)
  resetDayNight()
})

describe('End-to-End-Loop: Tag → Nacht → Raid → Ergebnis → Tag', () => {
  it('durchläuft Sieg und Fehlschlag komplett und bleibt unter dem Zeitbudget', () => {
    resetDayNight()
    const started = Date.now()

    expect(dayNight.value.phase).toBe('tag')
    expect(startNight()).toBe(true)
    expect(dayNight.value.phase).toBe('night')

    expect(triggerRaid()).toBe(true)
    expect(dayNight.value.phase).toBe('raid')

    const won = runLocalFixtureRaid(createDungeonGrid())
    expect(RaidJobSchema.safeParse(won).success).toBe(true)
    expect(won.status).toBe('completed')
    expect(completeRaid(won)).toBe(true)
    expect(dayNight.value.phase).toBe('result')
    expect(dayNight.value.job).toEqual(won)

    expect(finishResult(won)).toBe(true)
    expect(dayNight.value.phase).toBe('tag')
    expect(dayNight.value.day).toBe(fixture.day + 1)
    expect(dayNight.value.job).toBeNull()

    expect(startNight()).toBe(true)
    expect(triggerRaid()).toBe(true)
    const blocked = runLocalFixtureRaid(blockedGrid())
    expect(blocked.status).toBe('failed')
    expect(completeRaid(blocked)).toBe(true)
    expect(dayNight.value.phase).toBe('result')

    expect(finishResult(blocked)).toBe(true)
    expect(dayNight.value.phase).toBe('raid')
    expect(dayNight.value.day).toBe(fixture.day + 1)

    const wonAgain = runLocalFixtureRaid(createDungeonGrid())
    expect(completeRaid(wonAgain)).toBe(true)
    expect(finishResult(wonAgain)).toBe(true)
    expect(dayNight.value.phase).toBe('tag')
    expect(dayNight.value.day).toBe(fixture.day + 2)

    expect(Date.now() - started).toBeLessThan(BUDGET_MS)
  })

  it('bleibt über wiederholte Schleifen deterministisch und im Budget', () => {
    resetDayNight()
    const started = Date.now()
    const hashes = new Set<string>()

    for (let day = 1; day <= 3; day += 1) {
      expect(dayNight.value.phase).toBe('tag')
      expect(dayNight.value.day).toBe(fixture.day + day - 1)
      expect(startNight()).toBe(true)
      expect(triggerRaid()).toBe(true)
      const job = runLocalFixtureRaid(createDungeonGrid())
      if (job.status !== 'completed') {
        throw new Error('Fixture-Auftrag muss abgeschlossen sein')
      }
      hashes.add(job.result.hash)
      expect(completeRaid(job)).toBe(true)
      expect(finishResult(job)).toBe(true)
    }

    expect(hashes).toHaveLength(1)
    expect(dayNight.value.day).toBe(fixture.day + 3)
    expect(Date.now() - started).toBeLessThan(BUDGET_MS)
  })

  it('weist Skip-Versuche im laufenden Loop ab, ohne die Phase zu ändern', () => {
    resetDayNight()
    const started = Date.now()

    expect(startNight()).toBe(true)
    expect(completeRaid(runLocalFixtureRaid(createDungeonGrid()))).toBe(false)
    expect(dayNight.value.phase).toBe('night')
    expect(dayNight.value.job).toBeNull()

    expect(triggerRaid()).toBe(true)
    expect(startNight()).toBe(false)
    expect(finishResult(runLocalFixtureRaid(createDungeonGrid()))).toBe(false)
    expect(dayNight.value.phase).toBe('raid')

    expect(Date.now() - started).toBeLessThan(BUDGET_MS)
  })
})
