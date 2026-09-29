import { neighbors } from './grid'
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

const CELL_COUNT = GRID_SIZE * GRID_SIZE

/**
 * Die zusammenhängende Zellenmenge um `start`, gefiltert nach `isOpen`.
 *
 * **Es gibt genau eine Flutfüllung im Raster.** Zuvor standen zwei davon nebeneinander:
 * eine für die Platzierungsgruppen und eine für die Zonen, mit je eigenem
 * `seen`-Feld und derselben Schleife. Der Unterschied lag nur im Prädikat.
 * `seen` markiert hier selbst, damit der Aufrufer kein zweites Merkfeld führt.
 */
function component(
  start: number,
  isOpen: (index: number) => boolean,
  seen: Uint8Array,
): number[] {
  const cells = [start]
  seen[start] = 1
  for (let cursor = 0; cursor < cells.length; cursor += 1) {
    for (const next of neighbors(cells[cursor])) {
      if (seen[next] || !isOpen(next)) continue
      seen[next] = 1
      cells.push(next)
    }
  }
  return cells
}

function placementGroups(grid: DungeonGrid): number[][] {
  const seen = new Uint8Array(CELL_COUNT)
  const groups: number[][] = []
  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (grid.cells[index] !== CellType.Placement || seen[index]) continue
    groups.push(
      component(index, (next) => grid.cells[next] === CellType.Placement, seen),
    )
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
  const seen = new Uint8Array(CELL_COUNT)
  for (let index = 0; index < CELL_COUNT; index += 1) {
    const type = types[index]
    if (type === null || seen[index]) continue
    const id = zones.length
    const cells = component(index, (next) => types[next] === type, seen)
    for (const cell of cells) byCell[cell] = { id, type }
    zones.push({ id, type, cells })
  }
  return { byCell, zones, placements: placementGroups(grid) }
}
