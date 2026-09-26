import { simulateCombat } from './simulate'
import type { CombatLog } from './types'

export function replayCombat(log: CombatLog): CombatLog {
  return simulateCombat({
    seed: log.seed,
    units: log.units,
    config: log.config,
    trail: log.trail,
  })
}

export function verifyCombatLog(log: CombatLog): boolean {
  const replayed = replayCombat(log)
  if (replayed.trail.length !== log.trail.length) return false
  for (let index = 0; index < log.trail.length; index += 1) {
    const left = log.trail[index]
    const right = replayed.trail[index]
    if (
      !left ||
      !right ||
      left.x !== right.x ||
      left.y !== right.y ||
      left.cell !== right.cell
    )
      return false
  }
  return (
    replayed.hash === log.hash &&
    replayed.stage === log.stage &&
    replayed.ticks === log.ticks &&
    replayed.events.length === log.events.length
  )
}
