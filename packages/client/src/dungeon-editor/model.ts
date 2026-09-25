import {
  CellType,
  type CellTypeValue,
  type DungeonGrid,
  type PathResult,
  VISIBLE_TILE_SIZE,
  cloneDungeonGrid,
  getCell,
  setCell,
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
