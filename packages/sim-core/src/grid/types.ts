export const GRID_SIZE = 64
export const VISIBLE_TILE_SIZE = 16
export const LOGIC_CELLS_PER_VISIBLE_TILE = 4

export const CellType = {
  Empty: 0,
  Wall: 1,
  Trap: 2,
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

export type PathMode = 'within-budget' | 'trap-fallback' | 'unreachable'

export interface PathResult {
  mode: PathMode
  path: Point[]
  movementCost: number
  detourCost: number
}
