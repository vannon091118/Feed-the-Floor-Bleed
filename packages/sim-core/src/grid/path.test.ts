import { describe, expect, it } from 'vitest'
import {
  CellType,
  type DungeonGrid,
  GRID_SIZE,
  type Point,
  createDungeonGrid,
  findPath,
  hasValidRoute,
  logicCellsPerVisibleTile,
  setCell,
  visibleTileCount,
} from './index'
import { search } from './path-search'

function carveStraightRoute(grid: DungeonGrid): void {
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (x === 0 && y === 0) continue
      if (x === GRID_SIZE - 1 && y === GRID_SIZE - 1) continue
      setCell(grid, { x, y }, CellType.Wall)
    }
  }
  for (let x = 1; x < GRID_SIZE; x += 1) {
    setCell(grid, { x, y: 0 }, CellType.Empty)
  }
  for (let y = 1; y < GRID_SIZE - 1; y += 1) {
    setCell(grid, { x: GRID_SIZE - 1, y }, CellType.Empty)
  }
}

describe('dungeon grid', () => {
  it('stores 64x64 logic cells and maps four-by-four cells to a visible tile', () => {
    const grid = createDungeonGrid()
    expect(grid.cells).toHaveLength(4096)
    expect(visibleTileCount()).toBe(16)
    expect(logicCellsPerVisibleTile()).toBe(4)
    expect(16 * 16 * 4 * 4).toBe(grid.cells.length)
  })

  it('finds the empty direct route', () => {
    const result = findPath(createDungeonGrid())
    expect(result.mode).toBe('within-budget')
    expect(result.path).toHaveLength(127)
    expect(result.movementCost).toBe(125)
    expect(result.detourCost).toBe(0)
  })

  it('keeps a single trap inside the five-point detour budget', () => {
    const grid = createDungeonGrid()
    carveStraightRoute(grid)
    setCell(grid, { x: 1, y: 0 }, CellType.Trap)
    const result = findPath(grid)
    expect(result.mode).toBe('within-budget')
    expect(result.detourCost).toBe(3)
  })

  it('falls back to trap damage when the detour budget is exceeded', () => {
    const grid = createDungeonGrid()
    carveStraightRoute(grid)
    setCell(grid, { x: 1, y: 0 }, CellType.Trap)
    setCell(grid, { x: 2, y: 0 }, CellType.Trap)
    const result = findPath(grid)
    expect(result.mode).toBe('trap-fallback')
    expect(result.detourCost).toBe(6)
  })

  it('hard-blocks a boss with no route', () => {
    const grid = createDungeonGrid()
    carveStraightRoute(grid)
    setCell(grid, { x: 1, y: 0 }, CellType.Wall)
    setCell(grid, { x: GRID_SIZE - 1, y: GRID_SIZE - 2 }, CellType.Wall)
    expect(findPath(grid).mode).toBe('unreachable')
    expect(hasValidRoute(grid)).toBe(false)
  })

  it('does not allow replacing spawn or boss', () => {
    const grid = createDungeonGrid()
    expect(() => setCell(grid, { x: 0, y: 0 }, CellType.Wall)).toThrow()
    expect(() =>
      setCell(grid, { x: GRID_SIZE - 1, y: GRID_SIZE - 1 }, CellType.Wall),
    ).toThrow()
  })

  it('does not allow duplicate spawn or boss markers', () => {
    const grid = createDungeonGrid()
    expect(() => setCell(grid, { x: 1, y: 0 }, CellType.Spawn)).toThrow()
    expect(() =>
      setCell(grid, { x: GRID_SIZE - 2, y: GRID_SIZE - 1 }, CellType.Boss),
    ).toThrow()
  })

  it('rejects non-grid points', () => {
    const grid = createDungeonGrid()
    const point: Point = { x: 64, y: 0 }
    expect(() => setCell(grid, point, CellType.Empty)).toThrow()
  })

  it('optimizes the fallback for minimum cost, not minimum steps', () => {
    const grid = createDungeonGrid()
    carveStraightRoute(grid)
    setCell(grid, { x: 10, y: 0 }, CellType.Trap)
    setCell(grid, { x: 11, y: 0 }, CellType.Trap)
    for (const x of [9, 10, 11, 12]) {
      setCell(grid, { x, y: 1 }, CellType.Empty)
    }

    // Trap-Route: 126 Steps, 131 Kosten. Umweg-Loop über y=1: 128 Steps, 127 Kosten.
    const stepsFirst = search(grid, Number.POSITIVE_INFINITY, true)
    const costFirst = search(grid, Number.POSITIVE_INFINITY, false)
    expect(stepsFirst?.steps).toBe(126)
    expect(stepsFirst?.cost).toBe(131)
    expect(costFirst?.cost).toBe(127)
    expect(costFirst?.steps).toBe(128)

    // Budget 1 lässt beide Wege im within-budget-Suchraum platzen — der
    // Fallback muss die kostenminimale Route wählen, nicht die kürzeste.
    const result = findPath(grid, 1)
    expect(result.mode).toBe('trap-fallback')
    expect(result.movementCost).toBe(127)
    expect(result.detourCost).toBe(2)
    expect(result.path).not.toContainEqual({ x: 10, y: 0 })
    expect(result.path).not.toContainEqual({ x: 11, y: 0 })
  })
})
