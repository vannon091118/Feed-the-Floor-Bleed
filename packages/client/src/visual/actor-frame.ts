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
): ActorDescriptor[] {
  return units.map((unit) => {
    const frame = frameUnit(unit, events, playbackTick)
    const cell = routePointAt(path, frame.routeIndex)
    return {
      id: unit.id,
      kind: kindOf(unit.role),
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
