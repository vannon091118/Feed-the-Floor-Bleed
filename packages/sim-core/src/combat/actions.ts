import { createRng, deriveSeed, nextBelow } from '../prng'
import { damageFor } from './state'
import type { CombatConfig, CombatEvent, CombatUnitState } from './types'

export function applyAttack(
  actor: CombatUnitState,
  target: CombatUnitState,
  tick: number,
  events: CombatEvent[],
  seed: number,
  config: CombatConfig,
): void {
  const rng = createRng(
    deriveSeed(seed, tick * 4096 + actor.routeIndex, target.routeIndex),
  )
  const swing = config.varianceSwing
  const spread = nextBelow(rng, swing * 2 + 1) - swing
  const amount = damageFor(
    actor,
    target,
    config.variancePermille + spread,
    config,
  )
  target.hp = target.hp - amount
  if (target.hp < 0) target.hp = 0
  events.push({
    tick,
    type: 'attack',
    actorId: actor.id,
    targetId: target.id,
    amount,
    fromIndex: actor.routeIndex,
    toIndex: target.routeIndex,
    stage: 'running',
  })
  actor.nextActionTick = tick + actor.attackCooldown
  if (target.hp === 0) {
    target.alive = false
    events.push({
      tick,
      type: 'death',
      actorId: target.id,
      targetId: actor.id,
      amount: 0,
      fromIndex: target.routeIndex,
      toIndex: actor.routeIndex,
      stage: 'running',
    })
  }
}

export function applyMove(
  actor: CombatUnitState,
  target: CombatUnitState,
  tick: number,
  events: CombatEvent[],
): void {
  const fromIndex = actor.routeIndex
  const step = target.routeIndex > fromIndex ? 1 : -1
  const toIndex = fromIndex + step
  actor.routeIndex = toIndex === fromIndex ? fromIndex : toIndex
  actor.nextActionTick = tick + actor.moveCooldown
  events.push({
    tick,
    type: 'move',
    actorId: actor.id,
    targetId: '',
    amount: 0,
    fromIndex,
    toIndex: actor.routeIndex,
    stage: 'running',
  })
}
