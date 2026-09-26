import {
  CellType,
  type CellTypeValue,
  cloneDungeonGrid,
  type DungeonGrid,
  getCell,
  type PathResult,
  type Point,
  setCell,
  VISIBLE_TILE_SIZE,
} from '@floor/sim-core'

export type Brush = 'empty' | 'wall' | 'trap'

const CELL_BY_BRUSH: Record<Brush, CellTypeValue> = {
  empty: CellType.Empty,
  wall: CellType.Wall,
  trap: CellType.Trap,
}

function isVisibleTile(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < VISIBLE_TILE_SIZE
}

export function paintTile(
  grid: DungeonGrid,
  brush: Brush,
  tileX: number,
  tileY: number,
): DungeonGrid {
  if (!isVisibleTile(tileX) || !isVisibleTile(tileY)) return grid

  const next = cloneDungeonGrid(grid)
  const cell = CELL_BY_BRUSH[brush]
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 4; x += 1) {
      const point = { x: tileX * 4 + x, y: tileY * 4 + y }
      const current = getCell(next, point)
      if (current === CellType.Spawn || current === CellType.Boss) continue
      setCell(next, point, cell)
    }
  }
  return next
}

export function visibleRouteTiles(route: PathResult): Set<number> {
  return new Set(
    route.path.map(
      ({ x, y }) => Math.floor(y / 4) * VISIBLE_TILE_SIZE + Math.floor(x / 4),
    ),
  )
}

/** Logikzellen je sichtbarem Tile. Feste 4, muss zu `VISIBLE_TILE_SIZE` passen. */
const CELLS_PER_TILE = 4

function coversTile(point: Point, tileX: number, tileY: number): boolean {
  return (
    point.x >= tileX * CELLS_PER_TILE &&
    point.x < (tileX + 1) * CELLS_PER_TILE &&
    point.y >= tileY * CELLS_PER_TILE &&
    point.y < (tileY + 1) * CELLS_PER_TILE
  )
}

/**
 * Welcher Anker liegt in diesem Tile?
 *
 * Spawn und Boss sind Logikzellen, keine Tile-Ecken. Ein Vergleich gegen die
 * erste Zelle des Tiles verfehlt den Boss bei 63,63, weil Tile 15,15 nur die
 * Zelle 60,60 sieht. Deshalb wird der Tile-Bereich geprüft.
 */
export function tileMarker(
  dungeon: DungeonGrid,
  tileX: number,
  tileY: number,
): 'start' | 'boss' | null {
  if (coversTile(dungeon.spawn, tileX, tileY)) return 'start'
  if (coversTile(dungeon.boss, tileX, tileY)) return 'boss'
  return null
}
