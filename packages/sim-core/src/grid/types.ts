export const GRID_SIZE = 64
export const VISIBLE_TILE_SIZE = 16
export const LOGIC_CELLS_PER_VISIBLE_TILE = 4

export const CellType = {
  Empty: 0,
  Wall: 1,
  /**
   * Platzierungsmarkierung. Sie markiert den Bereich, in dem eine Gruppe
   * steht, und ist für den Angreifer unsichtbar. Bis zum 2026-09-29 hieß sie
   * `Trap` und war ein Schadensfeld mit Kostenzuschlag; beides ist entfallen,
   * die Zellnummer 2 bleibt damit unverändert.
   */
  Placement: 2,
  Spawn: 3,
  Boss: 4,
} as const

export type CellTypeValue = (typeof CellType)[keyof typeof CellType]

export interface Point {
  x: number
  y: number
}

export interface DungeonGrid {
  cells: Uint8Array
  spawn: Point
  boss: Point
}

export type PathMode = 'reachable' | 'unreachable'

export interface PathResult {
  mode: PathMode
  path: Point[]
  /** Schritte entlang der Route. Wände sind unpassierbar, alles andere kostet eins. */
  movementCost: number
}
