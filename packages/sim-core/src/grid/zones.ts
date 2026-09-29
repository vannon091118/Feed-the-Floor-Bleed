import { CellType, type DungeonGrid, GRID_SIZE } from './types'

export type DungeonZoneType = 'corridor' | 'arena' | 'ambush' | 'boss-chamber'

export interface DungeonZone {
  id: number
  type: DungeonZoneType
  cells: number[]
}

export interface DungeonZones {
  byCell: Array<{ id: number; type: DungeonZoneType } | null>
  zones: DungeonZone[]
  placements: number[][]
}

const NEIGHBORS = [1, GRID_SIZE, -1, -GRID_SIZE] as const
const CELL_COUNT = GRID_SIZE * GRID_SIZE

function neighbors(index: number): number[] {
  const x = index % GRID_SIZE
  const y = Math.floor(index / GRID_SIZE)
  return NEIGHBORS.flatMap((step) => {
    const next = index + step
    if (next < 0 || next >= CELL_COUNT) return []
    if (step === 1 && x === GRID_SIZE - 1) return []
    if (step === -1 && x === 0) return []
    if (step === GRID_SIZE && y === GRID_SIZE - 1) return []
    if (step === -GRID_SIZE && y === 0) return []
    return [next]
  })
}

function placementGroups(grid: DungeonGrid): number[][] {
  const seen = new Uint8Array(CELL_COUNT)
  const groups: number[][] = []
  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (grid.cells[index] !== CellType.Placement || seen[index]) continue
    const cells = [index]
    seen[index] = 1
    for (let cursor = 0; cursor < cells.length; cursor += 1) {
      for (const next of neighbors(cells[cursor])) {
        if (grid.cells[next] !== CellType.Placement || seen[next]) continue
        seen[next] = 1
        cells.push(next)
      }
    }
    groups.push(cells)
  }
  return groups
}

function baseType(grid: DungeonGrid, index: number): DungeonZoneType | null {
  const cell = grid.cells[index]
  if (cell === CellType.Wall) return null
  if (cell === CellType.Placement) return 'ambush'
  const open = neighbors(index).filter(
    (next) => grid.cells[next] !== CellType.Wall,
  ).length
  return open <= 2 ? 'corridor' : 'arena'
}

/** Jede begehbare Zelle erhält einen stabilen Zonen-Typ und eine Komponenten-ID. */
export function classifyDungeonZones(grid: DungeonGrid): DungeonZones {
  const types = Array.from({ length: CELL_COUNT }, (_, index) =>
    baseType(grid, index),
  )
  const boss = grid.boss.y * GRID_SIZE + grid.boss.x
  if (types[boss] !== null) types[boss] = 'boss-chamber'
  for (const next of neighbors(boss)) {
    if (types[next] === 'arena') types[next] = 'boss-chamber'
  }

  const byCell: DungeonZones['byCell'] = Array(CELL_COUNT).fill(null)
  const zones: DungeonZone[] = []
  for (let index = 0; index < CELL_COUNT; index += 1) {
    const type = types[index]
    if (type === null || byCell[index]) continue
    const id = zones.length
    const cells = [index]
    byCell[index] = { id, type }
    for (let cursor = 0; cursor < cells.length; cursor += 1) {
      for (const next of neighbors(cells[cursor])) {
        if (types[next] !== type || byCell[next]) continue
        byCell[next] = { id, type }
        cells.push(next)
      }
    }
    zones.push({ id, type, cells })
  }
  return { byCell, zones, placements: placementGroups(grid) }
}
