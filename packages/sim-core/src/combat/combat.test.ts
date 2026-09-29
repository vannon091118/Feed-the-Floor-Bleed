import { describe, expect, it } from 'vitest'
import { baseMonsters } from '../genome/registry'
import { CellType, createDungeonGrid, setCell } from '../grid'
import {
  buildCombatUnits,
  defaultCombatConfig,
  replayCombat,
  resolveCombat,
  summarizeCombat,
  verifyCombatLog,
} from './index'
import { createUnitStates, damageFor } from './state'

const grid = createDungeonGrid()
/** n echte Basisarten, damit die Tests dasselbe rechnen wie das Spiel. */
const defenders = (count: number) =>
  baseMonsters()
    .slice(0, count)
    .map((base) => ({ baseId: base.id }))
const base = { grid, teamSize: 3, defenders: defenders(5) }

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

  it('zählt Monster ohne den Boss und führt den Boss als eigenes Feld', () => {
    const config = { ...defaultCombatConfig(), maxTicks: 1 }
    const log = resolveCombat({
      grid,
      seed: 5,
      teamSize: 1,
      defenders: defenders(2),
      config,
    })
    const summary = summarizeCombat(log)
    expect(log.units.filter((unit) => unit.side === 'monsters')).toHaveLength(3)
    expect(summary.defendersTotal).toBe(3)
    expect(summary.monstersAlive).toBe(2)
    expect(summary.bossAlive).toBe(true)
    expect(summary.heroesAlive).toBe(1)
  })

  it('macht die gefallenen Verteidiger aus der Summary allein berechenbar', () => {
    // Die Summary ist der einzige Teil des Laufs, der in einem abgelegten
    // Ergebnis steht; der Kampflog liegt dort nicht. Diese Zusage steht in
    // `contracts/src/combat-log.ts` und in `docs/VISUAL_GRUNDSATZ.md` — hier
    // wird sie gegen die Ereignisse des Logs geprüft, statt sie zu glauben.
    const log = resolveCombat({ ...base, seed: 42 })
    const summary = summarizeCombat(log)
    const defenderIds = new Set(
      log.units
        .filter((unit) => unit.side === 'monsters')
        .map((unit) => unit.id),
    )
    const slain = log.events.filter(
      (event) => event.type === 'death' && defenderIds.has(event.actorId),
    ).length
    const reckoning =
      summary.defendersTotal -
      summary.monstersAlive -
      (summary.bossAlive ? 1 : 0)
    expect(reckoning).toBe(slain)
    expect(summary.defendersTotal).toBe(base.defenders.length + 1)
  })

  it('stellt Helden vorne und den Boss ans Routenende', () => {
    const units = buildCombatUnits({
      teamSize: 3,
      defenders: defenders(2),
      routeLength: 100,
    })
    expect(units[0].side).toBe('heroes')
    expect(units[units.length - 1].role).toBe('boss')
    expect(units[units.length - 1].routeIndex).toBe(99)
  })

  it('begrenzt Team und Monster-Slots auf das bestätigte Maximum', () => {
    expect(() => resolveCombat({ ...base, seed: 1, teamSize: 6 })).toThrow()
    expect(() =>
      resolveCombat({ ...base, seed: 1, defenders: defenders(6) }),
    ).toThrow()
  })

  it('verweigert Combat ohne erreichbare Route', () => {
    const blocked = createDungeonGrid()
    setCell(blocked, { x: 62, y: 63 }, CellType.Wall)
    setCell(blocked, { x: 63, y: 62 }, CellType.Wall)
    expect(() =>
      resolveCombat({
        grid: blocked,
        seed: 1,
        teamSize: 3,
        defenders: defenders(5),
      }),
    ).toThrow()
  })
})

describe('Schadensformel', () => {
  const config = defaultCombatConfig()
  const units = createUnitStates(
    buildCombatUnits({ teamSize: 1, defenders: [], routeLength: 2 }),
    config,
  )
  const hero = units[0]
  const boss = units[1]

  it('bleibt im Normalfall über dem Bodenwert', () => {
    expect(
      damageFor(hero, boss, config.variancePermille, config),
    ).toBeGreaterThan(config.damageFloor)
  })

  it('fällt bei negativer Streuung auf den Bodenwert statt in den Minusbereich', () => {
    // `variancePermille` ist im Contract ein freies Ganzzahlfeld: negativ ist
    // erlaubt, und die Streuung in `applyAttack` kann es ebenfalls drücken.
    expect(damageFor(hero, boss, -500, config)).toBe(config.damageFloor)
  })

  it('fällt auf den Bodenwert, wenn die Verteidigung über dem Angriff liegt', () => {
    const gepanzert = { ...boss, defense: hero.attack + 1 }
    expect(damageFor(hero, gepanzert, config.variancePermille, config)).toBe(
      config.damageFloor,
    )
  })
})
