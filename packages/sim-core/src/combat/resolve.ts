import { type DungeonGrid, findPath, getCell } from '../grid'
import {
  buildCombatUnits,
  type DefenderSlot,
  defaultCombatConfig,
} from './rules'
import { simulateCombat } from './simulate'
import type { CombatConfig, CombatLog, CombatTrailEntry } from './types'

export interface ResolveCombatInput {
  seed: number
  grid: DungeonGrid
  teamSize: number
  /**
   * Die Verteidiger in Slot-Reihenfolge; leere Plätze als `null`. Vorher stand
   * hier `monsterSlots: number`, und damit war die Art verloren, bevor der
   * Kampf sie brauchen konnte — jeder Slot bekam dieselben Werte.
   */
  defenders: readonly DefenderSlot[]
  config?: CombatConfig
}

export function resolveCombat(input: ResolveCombatInput): CombatLog {
  if (input.teamSize < 1 || input.teamSize > 5)
    throw new Error('teamSize must be between 1 and 5')
  if (input.defenders.length > 5) throw new Error('defenders must not exceed 5')
  const config = input.config ?? defaultCombatConfig()
  const route = findPath(input.grid)
  if (route.mode === 'unreachable')
    throw new Error('combat requires a reachable route')
  const trail: CombatTrailEntry[] = route.path.map((point) => ({
    x: point.x,
    y: point.y,
    cell: getCell(input.grid, point),
  }))
  const units = buildCombatUnits({
    teamSize: input.teamSize,
    defenders: input.defenders,
    routeLength: route.path.length,
  })
  return simulateCombat({ seed: input.seed, units, config, trail })
}
