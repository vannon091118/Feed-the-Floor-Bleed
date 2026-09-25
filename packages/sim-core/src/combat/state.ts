import { absInt, clampInt, mulFixed } from '../math'
import type {
  CombatConfig,
  CombatStage,
  CombatUnitSpec,
  CombatUnitState,
} from './types'

function startTick(initiative: number, tickRate: number): number {
  return Math.trunc(((1000 - clampInt(initiative, 0, 1000)) * tickRate) / 1000)
}

export function createUnitStates(
  specs: readonly CombatUnitSpec[],
  config: CombatConfig,
): CombatUnitState[] {
  return specs.map((spec) => ({
    ...spec,
    hp: spec.maxHp,
    alive: true,
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
    const distance = absInt(candidate.routeIndex - actor.routeIndex)
    if (distance < bestDistance) {
      best = candidate
      bestDistance = distance
    }
  }
  return best
}

export function distanceBetween(
  left: CombatUnitState,
  right: CombatUnitState,
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
  const boss = states.find((unit) => unit.role === 'boss')
  if (!boss || !boss.alive) return 'heroes-win'
  const heroesAlive = states.some(
    (unit) => unit.side === 'heroes' && unit.alive,
  )
  if (!heroesAlive) return 'monsters-win'
  if (ticks >= config.maxTicks) return 'timeout'
  return 'running'
}
