import { describe, expect, it } from 'vitest'
import { CellType, createDungeonGrid, setCell } from '../grid'
import {
  buildCombatUnits,
  defaultCombatConfig,
  replayCombat,
  resolveCombat,
  verifyCombatLog,
} from './index'

const grid = createDungeonGrid()
const base = { grid, teamSize: 3, monsterSlots: 5 }

describe('Deterministischer Combat-Core', () => {
  it('erzeugt bei gleichem Seed denselben Hash und identischen Log', () => {
    const first = resolveCombat({ ...base, seed: 42 })
    const second = resolveCombat({ ...base, seed: 42 })
    expect(first.hash).toBe(second.hash)
    expect(first.events).toEqual(second.events)
    expect(first.stage).toBe(second.stage)
    expect(first.ticks).toBe(second.ticks)
  })

  it('ändert den Hash mit dem Seed', () => {
    expect(resolveCombat({ ...base, seed: 1 }).hash).not.toBe(
      resolveCombat({ ...base, seed: 2 }).hash,
    )
  })

  it('spielt einen gespeicherten Log identisch nach', () => {
    const log = resolveCombat({ ...base, seed: 7 })
    expect(verifyCombatLog(log)).toBe(true)
    expect(replayCombat(log).hash).toBe(log.hash)
  })

  it('beendet sich am Tick-Limit als Timeout', () => {
    const config = { ...defaultCombatConfig(), maxTicks: 5 }
    const log = resolveCombat({ ...base, seed: 3, config })
    expect(log.ticks).toBe(5)
    expect(log.stage).toBe('timeout')
  })

  it('liefert einen achtstelligen Hex-Hash', () => {
    expect(resolveCombat({ ...base, seed: 99 }).hash).toMatch(/^[0-9a-f]{8}$/)
  })

  it('stellt Helden vorne und den Boss ans Routenende', () => {
    const units = buildCombatUnits({
      teamSize: 3,
      monsterSlots: 2,
      routeLength: 100,
    })
    expect(units[0].side).toBe('heroes')
    expect(units[units.length - 1].role).toBe('boss')
    expect(units[units.length - 1].routeIndex).toBe(99)
  })

  it('begrenzt Team und Monster-Slots auf das bestätigte Maximum', () => {
    expect(() => resolveCombat({ ...base, seed: 1, teamSize: 6 })).toThrow()
    expect(() => resolveCombat({ ...base, seed: 1, monsterSlots: 6 })).toThrow()
  })

  it('verweigert Combat ohne erreichbare Route', () => {
    const blocked = createDungeonGrid()
    setCell(blocked, { x: 62, y: 63 }, CellType.Wall)
    setCell(blocked, { x: 63, y: 62 }, CellType.Wall)
    expect(() =>
      resolveCombat({ grid: blocked, seed: 1, teamSize: 3, monsterSlots: 5 }),
    ).toThrow()
  })
})
