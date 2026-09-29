import { absInt, clampInt, mulFixed } from '../math'
import { isBoss } from './boss'
import type {
  CombatConfig,
  CombatStage,
  CombatTrailEntry,
  CombatUnitSpec,
  CombatUnitState,
} from './types'

function startTick(initiative: number, tickRate: number): number {
  return Math.trunc(((1000 - clampInt(initiative, 0, 1000)) * tickRate) / 1000)
}

/**
 * Aus Specs werden Zustände.
 *
 * Die Zone einer Einheit kommt aus dem Trail und nicht aus dem Grid: der Trail
 * ist der einzige Ortszeuge, den `replayCombat` aus dem Log hat.
 */
export function createUnitStates(
  specs: readonly CombatUnitSpec[],
  config: CombatConfig,
  trail: readonly CombatTrailEntry[],
): CombatUnitState[] {
  return specs.map((spec) => ({
    ...spec,
    hp: spec.maxHp,
    alive: true,
    ambushAvailable: spec.ambushZoneId >= 0,
    zoneId: trail[spec.routeIndex].zoneId,
    nextActionTick: startTick(spec.initiative, config.tickRate),
  }))
}

export function nearestOpponent(
  states: readonly CombatUnitState[],
  actor: CombatUnitState,
): CombatUnitState | undefined {
  let best: CombatUnitState | undefined
  let bestDistance = Number.MAX_SAFE_INTEGER
  for (const candidate of states) {
    if (!candidate.alive || candidate.side === actor.side) continue
    const distance = distanceBetween(actor, candidate)
    if (distance < bestDistance) {
      best = candidate
      bestDistance = distance
    }
  }
  return best
}

/** Abstand auf der Route, in Schritten. */
export function distanceBetween(
  left: CombatUnitSpec,
  right: CombatUnitSpec,
): number {
  return absInt(left.routeIndex - right.routeIndex)
}

export function damageFor(
  actor: CombatUnitState,
  target: CombatUnitState,
  variancePermille: number,
  config: CombatConfig,
): number {
  const base = actor.attack - target.defense
  const varied = mulFixed(base > 0 ? base : 0, variancePermille)
  return varied > config.damageFloor ? varied : config.damageFloor
}

export function evaluateStage(
  states: readonly CombatUnitState[],
  ticks: number,
  config: CombatConfig,
): CombatStage | 'running' {
  const boss = states.find(isBoss)
  if (!boss?.alive) return 'heroes-win'
  const heroesAlive = states.some(
    (unit) => unit.side === 'heroes' && unit.alive,
  )
  if (!heroesAlive) return 'monsters-win'
  if (ticks >= config.maxTicks) return 'timeout'
  return 'running'
}
