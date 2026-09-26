import { type DungeonGrid, findPath, getCell } from '../grid'
import { buildCombatUnits, defaultCombatConfig } from './rules'
import { simulateCombat } from './simulate'
import type { CombatConfig, CombatLog, CombatTrailEntry } from './types'

export interface ResolveCombatInput {
  seed: number
  grid: DungeonGrid
  teamSize: number
  monsterSlots: number
  config?: CombatConfig
}

export function resolveCombat(input: ResolveCombatInput): CombatLog {
  if (input.teamSize < 1 || input.teamSize > 5)
    throw new Error('teamSize must be between 1 and 5')
  if (input.monsterSlots < 0 || input.monsterSlots > 5)
    throw new Error('monsterSlots must be between 0 and 5')
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
    monsterSlots: input.monsterSlots,
    routeLength: route.path.length,
  })
  return simulateCombat({ seed: input.seed, units, config, trail })
}
