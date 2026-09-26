import { applyAttack, applyMove } from './actions'
import { fingerprintCombatLog } from './fingerprint'
import {
  createUnitStates,
  distanceBetween,
  evaluateStage,
  nearestOpponent,
} from './state'
import type {
  CombatConfig,
  CombatEvent,
  CombatLog,
  CombatStage,
  CombatTrailEntry,
  CombatUnitSpec,
} from './types'

export interface SimulateCombatInput {
  seed: number
  units: CombatUnitSpec[]
  config: CombatConfig
  trail: CombatTrailEntry[]
}

export function simulateCombat(input: SimulateCombatInput): CombatLog {
  const states = createUnitStates(input.units, input.config)
  const events: CombatEvent[] = []
  let stage: CombatStage = 'timeout'
  let ticks = 0
  let finished = false

  for (let tick = 0; tick < input.config.maxTicks && !finished; tick += 1) {
    ticks = tick + 1
    for (let index = 0; index < states.length; index += 1) {
      const actor = states[index]
      if (!actor.alive || actor.nextActionTick > tick) continue
      const target = nearestOpponent(states, actor)
      if (!target) continue
      if (distanceBetween(actor, target) <= input.config.attackRange) {
        applyAttack(actor, target, tick, events, input.seed, input.config)
      } else {
        applyMove(actor, target, tick, events)
      }
    }
    const evaluated = evaluateStage(states, ticks, input.config)
    if (evaluated !== 'running') {
      stage = evaluated
      finished = true
    }
  }

  events.push({
    tick: ticks,
    type: 'end',
    actorId: '',
    targetId: '',
    amount: 0,
    fromIndex: 0,
    toIndex: 0,
    stage,
  })
  const log: CombatLog = {
    seed: input.seed,
    config: input.config,
    units: input.units,
    events,
    stage,
    ticks,
    hash: '',
    trail: input.trail,
  }
  log.hash = fingerprintCombatLog(log)
  return log
}
