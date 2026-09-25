import {
  type CombatEvent,
  type CombatLog,
  type CombatUnitSpec,
  type Point,
  hashFinish,
  hashStart,
  hashText,
} from '@floor/sim-core'
import {
  type ActorDescriptor,
  type ActorKind,
  type FxDescriptor,
  cellFoot,
} from '../world'

export interface CombatFrame {
  actors: ActorDescriptor[]
  fx: FxDescriptor[]
}

const VARIANT_COUNT = 5

function variantOf(id: string): number {
  return hashFinish(hashText(hashStart(), id)) % VARIANT_COUNT
}

function kindOf(role: CombatUnitSpec['role']): ActorKind {
  if (role === 'boss') return 'boss'
  if (role === 'monster') return 'monster'
  return 'hero'
}

/** Route-Index → echte Logikzelle. Der Pfad ist die räumliche Wahrheit. */
function pathAt(path: readonly Point[], index: number): Point {
  if (path.length === 0) return { x: 0, y: 0 }
  const bounded = Math.min(Math.max(index, 0), path.length - 1)
  return path[bounded]
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

function eventFx(
  event: CombatEvent,
  path: readonly Point[],
): FxDescriptor | null {
  if (event.type === 'move') {
    return {
      kind: 'dust',
      world: cellFoot(pathAt(path, event.toIndex)),
      amount: 1,
    }
  }
  if (event.type === 'attack') {
    return {
      kind: 'hit',
      world: cellFoot(pathAt(path, event.toIndex)),
      amount: event.amount,
    }
  }
  if (event.type === 'death') {
    return {
      kind: 'blood',
      world: cellFoot(pathAt(path, event.toIndex)),
      amount: 1,
    }
  }
  return null
}

/**
 * Präsentationsrahmen zum Tick `playbackTick`. FX entstehen nur für Ereignisse
 * im Fenster `(fromTick, playbackTick]`, damit ein Frame keine Ereignishistorie
 * erneut ausschüttet.
 */
export function combatFrame(
  log: CombatLog,
  path: readonly Point[],
  playbackTick: number,
  fromTick: number,
): CombatFrame {
  const actors: ActorDescriptor[] = []
  const fx: FxDescriptor[] = []
  for (const unit of log.units) {
    const frame = frameUnit(unit, log.events, playbackTick)
    const cell = pathAt(path, frame.routeIndex)
    actors.push({
      id: unit.id,
      kind: kindOf(unit.role),
      cell,
      world: cellFoot(cell),
      height: unit.role === 'boss' ? 18 : 14,
      hpRatio: unit.maxHp > 0 ? frame.hp / unit.maxHp : 0,
      facing: frame.facing,
      moving: !frame.dead && frame.lastMoveTick >= playbackTick - 3,
      variant: variantOf(unit.id),
    })
  }
  const start = Math.max(fromTick, -1)
  for (const event of log.events) {
    if (event.tick <= start || event.tick > playbackTick) continue
    const descriptor = eventFx(event, path)
    if (descriptor) fx.push(descriptor)
  }
  return { actors, fx }
}

/** Leerlaufbesetzung für den Editor: Helden am Start, Boss am Ziel. */
export function routeActors(path: readonly Point[]): ActorDescriptor[] {
  if (path.length === 0) return []
  const at = (index: number) => {
    const cell = pathAt(path, index)
    return { cell, world: cellFoot(cell) }
  }
  const specs: Array<{ id: string; kind: ActorKind; index: number }> = [
    { id: 'hero-a', kind: 'hero', index: 0 },
    { id: 'hero-b', kind: 'hero', index: 0 },
    { id: 'hero-c', kind: 'hero', index: 1 },
    { id: 'boss-0', kind: 'boss', index: path.length - 1 },
  ]
  return specs.map((spec) => ({
    id: spec.id,
    kind: spec.kind,
    ...at(spec.index),
    height: spec.kind === 'boss' ? 18 : 14,
    hpRatio: 1,
    facing: 1,
    moving: false,
    variant: variantOf(spec.id),
  }))
}
