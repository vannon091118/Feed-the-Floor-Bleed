import {
  CellType,
  type CellTypeValue,
  type DungeonGrid,
  GRID_SIZE,
  LOGIC_CELLS_PER_VISIBLE_TILE,
  type Point,
  VISIBLE_TILE_SIZE,
} from './types'

const CELL_COUNT = GRID_SIZE * GRID_SIZE

function assertPoint(point: Point): void {
  if (!Number.isInteger(point.x) || !Number.isInteger(point.y)) {
    throw new Error('grid point must use integer coordinates')
  }
  if (
    point.x < 0 ||
    point.x >= GRID_SIZE ||
    point.y < 0 ||
    point.y >= GRID_SIZE
  ) {
    throw new Error('grid point is outside the 64x64 grid')
  }
}

function assertCell(cell: CellTypeValue): void {
  if (!Object.values(CellType).includes(cell)) {
    throw new Error('unknown grid cell type')
  }
}

export function createDungeonGrid(
  spawn: Point = { x: 0, y: 0 },
  boss: Point = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 },
): DungeonGrid {
  assertPoint(spawn)
  assertPoint(boss)
  if (spawn.x === boss.x && spawn.y === boss.y) {
    throw new Error('spawn and boss must be different cells')
  }

  const cells = new Uint8Array(CELL_COUNT)
  cells.fill(CellType.Empty)
  const grid: DungeonGrid = { cells, spawn: { ...spawn }, boss: { ...boss } }
  setCell(grid, spawn, CellType.Spawn)
  setCell(grid, boss, CellType.Boss)
  return grid
}

export function cloneDungeonGrid(grid: DungeonGrid): DungeonGrid {
  return {
    cells: new Uint8Array(grid.cells),
    spawn: { ...grid.spawn },
    boss: { ...grid.boss },
  }
}

export function getCell(grid: DungeonGrid, point: Point): CellTypeValue {
  assertPoint(point)
  return grid.cells[point.y * GRID_SIZE + point.x] as CellTypeValue
}

export function setCell(
  grid: DungeonGrid,
  point: Point,
  cell: CellTypeValue,
): void {
  assertPoint(point)
  assertCell(cell)
  const index = point.y * GRID_SIZE + point.x
  const isSpawn = point.x === grid.spawn.x && point.y === grid.spawn.y
  const isBoss = point.x === grid.boss.x && point.y === grid.boss.y
  if (cell === CellType.Spawn && !isSpawn) {
    throw new Error('only the canonical spawn cell can contain a spawn point')
  }
  if (cell === CellType.Boss && !isBoss) {
    throw new Error('only the canonical boss cell can contain a boss slot')
  }
  if (
    (isSpawn && cell !== CellType.Spawn) ||
    (isBoss && cell !== CellType.Boss)
  ) {
    throw new Error('spawn and boss cells cannot be replaced')
  }
  grid.cells[index] = cell
}

export function gridSize(): number {
  return GRID_SIZE
}

export function visibleTileCount(): number {
  return VISIBLE_TILE_SIZE
}

export function logicCellsPerVisibleTile(): number {
  return LOGIC_CELLS_PER_VISIBLE_TILE
}
