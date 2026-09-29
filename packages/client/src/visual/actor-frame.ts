import type { CombatEvent, CombatUnitSpec, Point } from '@floor/sim-core'
import { type ActorDescriptor, type ActorKind, cellFoot } from '../world'
import { routePointAt } from './route-index'
import { actorVariant } from './variant'

function kindOf(role: CombatUnitSpec['role']): ActorKind {
  if (role === 'boss') return 'boss'
  if (role === 'monster') return 'monster'
  return 'hero'
}

interface UnitFrame {
  routeIndex: number
  hp: number
  dead: boolean
  lastMoveTick: number
  facing: 1 | -1
}

function frameUnit(
  unit: CombatUnitSpec,
  events: readonly CombatEvent[],
  upToTick: number,
): UnitFrame {
  const frame: UnitFrame = {
    routeIndex: unit.routeIndex,
    hp: unit.maxHp,
    dead: false,
    lastMoveTick: -1,
    facing: 1,
  }
  for (const event of events) {
    if (event.tick > upToTick) break
    if (event.type === 'move' && event.actorId === unit.id) {
      frame.routeIndex = event.toIndex
      frame.facing = event.toIndex >= event.fromIndex ? 1 : -1
      frame.lastMoveTick = event.tick
    } else if (event.type === 'attack' && event.targetId === unit.id) {
      frame.hp = Math.max(0, frame.hp - event.amount)
    } else if (event.type === 'death' && event.actorId === unit.id) {
      frame.dead = true
      frame.hp = 0
    }
  }
  return frame
}

export function combatActors(
  units: readonly CombatUnitSpec[],
  events: readonly CombatEvent[],
  path: readonly Point[],
  playbackTick: number,
  baseIds: readonly (string | undefined)[] = [],
): ActorDescriptor[] {
  // Die Basisarten stehen in Slot-Reihenfolge, die Einheiten aber nicht:
  // `buildCombatUnits` legt zuerst die Helden an, dann die Monster, dann den
  // Boss. Ein eigener Zähler zählt deshalb nur die Monster und ist die
  // Zuordnung, die der Core-Reihenfolge entspricht — der Array-Index wäre es
  // nicht, weil die Helden den Platz davor belegen.
  let monsterIndex = 0
  return units.map((unit) => {
    const frame = frameUnit(unit, events, playbackTick)
    const cell = routePointAt(path, frame.routeIndex)
    const kind = kindOf(unit.role)
    const baseId = kind === 'monster' ? baseIds[monsterIndex++] : undefined
    return {
      id: unit.id,
      kind,
      baseId,
      cell,
      world: cellFoot(cell),
      height: unit.role === 'boss' ? 18 : 14,
      hpRatio: unit.maxHp > 0 ? frame.hp / unit.maxHp : 0,
      facing: frame.facing,
      moving: !frame.dead && frame.lastMoveTick >= playbackTick - 3,
      variant: actorVariant(unit.id),
    }
  })
}
