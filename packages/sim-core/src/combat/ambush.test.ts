import { describe, expect, it } from 'vitest'
import { CellType, createDungeonGrid, setCell } from '../grid'
import { applyAttack } from './actions'
import { defaultCombatConfig, PROVISIONAL_RULES, resolveCombat } from './index'
import type { CombatEvent, CombatUnitState } from './types'

/**
 * Der Hinterhalt ist eine Zonen-Regel und trifft an genau einer Naht.
 *
 * `resolveCombat` klassifiziert die Zonen des Grids und stempelt sie in den
 * Trail; die Platzierungsgruppe eines Slots wird zur `ambushZoneId`, und der
 * erste Angriff eines so aufgestellten Verteidigers durchdringt Rüstung —
 * einmal, und nicht gegen ein Ziel, das in seiner Lauerzone steht. Beide Seiten
 * werden hier geprüft: die Rechnung an der Einheit und das Aufstellen am
 * laufenden Lauf. Ohne Platzierungszelle bleibt der Hinterhalt aus — auch das
 * steht hier, weil eine Mechanik ohne Beleg in beide Richtungen keine ist.
 */

/**
 * Ein Zustand mit den Feldern, die der Angriff liest.
 *
 * Die Zahlen liegen in der Größenordnung der Einheiten aus `units.ts` —
 * `damageFloor` ist ebenfalls fixpunktiert, und ein zu kleiner Angriff läge
 * unter dem Bodenwert, statt die Rüstung zu zeigen.
 */
function unit(overrides: Partial<CombatUnitState>): CombatUnitState {
  return {
    id: 'unit-0',
    side: 'monsters',
    role: 'monster',
    maxHp: 60000,
    attack: 12000,
    defense: 4000,
    initiative: 500,
    moveCooldown: 2,
    attackCooldown: 3,
    routeIndex: 0,
    ambushZoneId: -1,
    hp: 60000,
    alive: true,
    ambushAvailable: false,
    zoneId: 0,
    nextActionTick: 0,
    ...overrides,
  }
}

const heroUnit = () =>
  unit({ id: 'hero-0', side: 'heroes', role: 'hero', defense: 3000 })

function attack(
  actor: CombatUnitState,
  target: CombatUnitState,
  events: CombatEvent[] = [],
) {
  applyAttack(actor, target, 0, events, 11, defaultCombatConfig())
  return events
}

/** Die `[K]`-Regel als Rechnung, damit der Test sie nicht abschreibt. */
function penetrationOf(defense: number | undefined): number {
  return Math.trunc(
    ((defense ?? 0) * PROVISIONAL_RULES.ambushDefensePenetrationPermille) /
      1000,
  )
}

describe('Rüstungsdurchdringung des Hinterhalts', () => {
  it('setzt die durchdrungene Rüstung als eigenes Ereignis vor den Angriff', () => {
    const monster = unit({
      id: 'monster-0',
      ambushAvailable: true,
      ambushZoneId: 5,
      zoneId: 5,
    })
    const hero = unit({ ...heroUnit(), zoneId: 1 })
    const events = attack(monster, hero)
    expect(events.map((event) => event.type)).toEqual(['ambush', 'attack'])
    expect(events[0].amount).toBe(penetrationOf(hero.defense))
    expect(monster.ambushAvailable).toBe(false)
  })

  it('rechnet den Schaden gegen die durchdrungene Rüstung', () => {
    // Derselbe Saatstand: Tick, Route-Indizes und Seed sind gleich, also ist
    // die Streuung in beiden Läufen dieselbe und der Unterschied ist allein
    // die Rüstung.
    const target = { ...heroUnit(), zoneId: 1 }
    const withAmbush = attack(
      unit({
        id: 'monster-0',
        ambushAvailable: true,
        ambushZoneId: 5,
        zoneId: 5,
      }),
      { ...target },
    )
    const without = attack(unit({ id: 'monster-0', zoneId: 5 }), { ...target })
    const damage = (events: CombatEvent[]) =>
      events.find((event) => event.type === 'attack')?.amount ?? 0
    expect(damage(withAmbush)).toBeGreaterThan(damage(without))
    expect(penetrationOf(target.defense)).toBeGreaterThan(0)
  })

  it('springt nicht gegen ein Ziel in der Lauerzone und bleibt verfügbar', () => {
    const monster = unit({
      id: 'monster-0',
      ambushAvailable: true,
      ambushZoneId: 5,
      zoneId: 5,
    })
    const events: CombatEvent[] = []
    attack(monster, unit({ ...heroUnit(), zoneId: 5 }), events)
    expect(events.some((event) => event.type === 'ambush')).toBe(false)
    // Entdeckt heißt nicht verbraucht: das nächste Ziel steht außerhalb der
    // Zone, und dort springt er.
    expect(monster.ambushAvailable).toBe(true)
    attack(monster, unit({ ...heroUnit(), zoneId: 1 }), events)
    expect(events.filter((event) => event.type === 'ambush')).toHaveLength(1)
    expect(monster.ambushAvailable).toBe(false)
  })

  it('springt nur beim ersten Angriff', () => {
    const monster = unit({
      id: 'monster-0',
      ambushAvailable: true,
      ambushZoneId: 5,
      zoneId: 5,
    })
    const events: CombatEvent[] = []
    attack(monster, unit({ ...heroUnit(), zoneId: 1 }), events)
    attack(monster, unit({ ...heroUnit(), zoneId: 1 }), events)
    expect(events.filter((event) => event.type === 'ambush')).toHaveLength(1)
  })
})

describe('Hinterhalt aus der Platzierungsgruppe', () => {
  /** Eine Platzierungsgruppe neben der Route: Zellen (10,1) und (11,1). */
  function ambushGrid() {
    const grid = createDungeonGrid()
    setCell(grid, { x: 10, y: 1 }, CellType.Placement)
    setCell(grid, { x: 11, y: 1 }, CellType.Placement)
    return grid
  }

  const defenders = [{ baseId: 'frost-wolf' }]

  it('stellt den Verteidiger in die Zone seiner Gruppe und lässt ihn einmal zuschlagen', () => {
    const log = resolveCombat({
      grid: ambushGrid(),
      seed: 4242,
      teamSize: 3,
      defenders,
    })
    const monster = log.units.find((unit) => unit.role === 'monster')
    expect(monster?.ambushZoneId).toBeGreaterThanOrEqual(0)
    const ambushes = log.events.filter((event) => event.type === 'ambush')
    expect(ambushes).toHaveLength(1)
    const target = log.units.find((unit) => unit.id === ambushes[0].targetId)
    expect(ambushes[0].amount).toBe(penetrationOf(target?.defense))
    // Der Hinterhalt steht im Log vor dem Angriff, der aus ihm folgt.
    const index = log.events.indexOf(ambushes[0])
    expect(log.events[index + 1].type).toBe('attack')
    expect(log.events[index + 1].actorId).toBe(ambushes[0].actorId)
  })

  it('bleibt ohne Platzierungsgruppe aus', () => {
    const log = resolveCombat({
      grid: createDungeonGrid(),
      seed: 4242,
      teamSize: 3,
      defenders,
    })
    const monster = log.units.find((unit) => unit.role === 'monster')
    expect(monster?.ambushZoneId).toBe(-1)
    expect(log.events.some((event) => event.type === 'ambush')).toBe(false)
  })
})
