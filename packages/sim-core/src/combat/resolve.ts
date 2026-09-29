import {
  classifyDungeonZones,
  type DungeonGrid,
  findPath,
  GRID_SIZE,
  getCell,
} from '../grid'
import type { TeamCondition } from './conditions'
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
  /**
   * Die Nachwirkung je Held, in Team-Reihenfolge. Sie kommt aus dem
   * eingefrorenen Stand (`activeTeam`) und nicht aus einer zweiten Quelle.
   * Ohne Angabe kämpft das Team unversehrt — der Zustand der reinen
   * Engine-Aufrufe, die kein Dorf hinter sich haben.
   */
  team?: readonly TeamCondition[]
  config?: CombatConfig
}

/**
 * Rechnet einen Dungeon zu einem vollständigen Log.
 *
 * Die Zonen entstehen hier einmal und werden in den Trail gestempelt. Damit ist
 * der Trail die einzige Ortsquelle des Laufs: `simulateCombat` liest ihn, und
 * `replayCombat` hat überhaupt nur den Log. Ein zweiter Kontext neben dem Trail
 * wäre eine zweite Wahrheit über dieselbe Fläche — und der Replay-Pfad hätte
 * sie nicht.
 */
export function resolveCombat(input: ResolveCombatInput): CombatLog {
  if (input.teamSize < 1 || input.teamSize > 5)
    throw new Error('teamSize must be between 1 and 5')
  if (input.defenders.length > 5) throw new Error('defenders must not exceed 5')
  const config = input.config ?? defaultCombatConfig()
  const route = findPath(input.grid)
  if (route.mode === 'unreachable')
    throw new Error('combat requires a reachable route')
  const zones = classifyDungeonZones(input.grid)
  const trail: CombatTrailEntry[] = route.path.map((point) => ({
    x: point.x,
    y: point.y,
    cell: getCell(input.grid, point),
    // `null` gibt es nur für Wände, und Wände liegen nie auf der Route.
    zoneId: zones.byCell[point.y * GRID_SIZE + point.x]?.id ?? -1,
  }))
  const placements = zones.placements
  const units = buildCombatUnits({
    teamSize: input.teamSize,
    team: input.team,
    defenders: input.defenders,
    trail,
    placements,
    placementZoneIds: placements.map(
      (group) => zones.byCell[group[0]]?.id ?? -1,
    ),
  })
  return simulateCombat({ seed: input.seed, units, config, trail })
}
