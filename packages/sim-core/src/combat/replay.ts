import { simulateCombat } from './simulate'
import type { CombatLog } from './types'

export function replayCombat(log: CombatLog): CombatLog {
  return simulateCombat({
    seed: log.seed,
    units: log.units,
    config: log.config,
  })
}

export function verifyCombatLog(log: CombatLog): boolean {
  const replayed = replayCombat(log)
  return (
    replayed.hash === log.hash &&
    replayed.stage === log.stage &&
    replayed.ticks === log.ticks &&
    replayed.events.length === log.events.length
  )
}
