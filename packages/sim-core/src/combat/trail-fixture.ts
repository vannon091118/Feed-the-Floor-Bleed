import { GRID_SIZE } from '../grid'
import type { CombatTrailEntry } from './types'

/**
 * Ein Trail ohne Grid.
 *
 * Die Aufstellungs- und Schadenstests brauchen eine Route, aber keinen Dungeon:
 * `buildCombatUnits` liest daraus nur die Länge und die Zellen der
 * Platzierungsgruppen. Die Datei liegt neben den Tests statt in jeder von
 * ihnen, weil dasselbe Stück in mehreren stand und beide Dateien an ihrem
 * Zeilen-Cap lagen.
 *
 * `cell` ist überall Boden: die Zellart wertet hier niemand aus.
 */
export function trailOf(length: number): CombatTrailEntry[] {
  return Array.from({ length }, (_, index) => ({
    x: index % GRID_SIZE,
    y: Math.floor(index / GRID_SIZE),
    cell: 0,
    zoneId: 0,
  }))
}

/** Eine Aufstellung ohne Platzierungsgruppen: jede Verteidigerin fällt auf die gleichmäßige Verteilung zurück. */
export const noPlacements = {
  placements: [],
  placementZoneIds: [],
} as const
