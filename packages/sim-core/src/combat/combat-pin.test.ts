import { describe, expect, it } from 'vitest'
import { CellType, createDungeonGrid, setCell } from '../grid'
import { resolveCombat } from './index'

/**
 * Golden-Pin des Kampf-Hashes.
 *
 * Die Engines sind abgedeckt (gleicher Seed, Seed-Sensitivität, Trail,
 * Replay), aber keine davon pinnt einen absoluten Hash: alle vergleichen zwei
 * Läufe miteinander. Damit bliebe eine beiläufige Änderung an Einheiten,
 * Regelwerten oder Event-Reihenfolge grün, solange sie nur deterministisch
 * ist — und genau diese Änderung verschiebt den Hash jedes gespeicherten
 * Replays, ohne dass eine Version steigt.
 *
 * Diese Datei schließt die Lücke: fester Seed, festes Grid, erwarteter Hash
 * als Konstante. Ein roter Lauf hier ist kein Fehler, sondern eine
 * Entscheidung, die bewusst getroffen werden muss:
 *
 *   1. Ist die Änderung gewollt?
 *   2. Verschiebt sie den Hash, also `sim_version` und `CONTRACT_VERSION`?
 *   3. Sind die betroffenen Doku- und Migrationsstellen nachgezogen?
 *
 * Erst danach werden die Zahlen hier angepasst, und zwar im selben Commit.
 */
function observed(
  grid: ReturnType<typeof createDungeonGrid>,
  monsterSlots: number,
) {
  const log = resolveCombat({ grid, seed: 4242, teamSize: 3, monsterSlots })
  return {
    hash: log.hash,
    stage: log.stage,
    ticks: log.ticks,
    events: log.events.length,
    trail: log.trail.length,
  }
}

/** Zwei versetzte Barrieren erzwingen eine deutlich längere Route als der Direktweg. */
function snakeGrid() {
  const grid = createDungeonGrid()
  for (let x = 0; x < 63; x += 1) setCell(grid, { x, y: 20 }, CellType.Wall)
  for (let x = 1; x < 64; x += 1) setCell(grid, { x, y: 40 }, CellType.Wall)
  return grid
}

describe('Golden-Pin des Kampf-Hashes', () => {
  it('pinnt den Lauf auf dem offenen Fixture-Grid', () => {
    expect(observed(createDungeonGrid(), 2)).toEqual({
      hash: '94ba1954',
      stage: 'monsters-win',
      ticks: 225,
      events: 417,
      trail: 127,
    })
  })

  it('pinnt den Lauf auf der Umweg-Route mit voller Belegung', () => {
    expect(observed(snakeGrid(), 5)).toEqual({
      hash: 'f85b31c0',
      stage: 'monsters-win',
      ticks: 401,
      events: 1010,
      trail: 253,
    })
  })
})
