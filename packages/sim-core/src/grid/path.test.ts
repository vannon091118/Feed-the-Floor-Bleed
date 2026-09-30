import { describe, expect, it } from 'vitest'
import {
  CellType,
  createDungeonGrid,
  type DungeonGrid,
  findPath,
  GRID_SIZE,
  hasValidRoute,
  LOGIC_CELLS_PER_VISIBLE_TILE,
  type Point,
  setCell,
  VISIBLE_TILE_SIZE,
} from './index'

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

/**
 * Ein Korridor über die volle Rasterbreite: alle geraden Zeilen sind offen und
 * an abwechselnden Enden verbunden. Jede weitere offene Zelle wäre eine
 * Abkürzung, also ist der vollständige Durchlauf die längste Route, die sich in
 * einem 64×64-Raster erzwingen lässt. Der Boss sitzt am linken unteren Ende,
 * weil der Zickzack nach 32 Verbindern dort ankommt.
 */
function carveFullWidthRoute(grid: DungeonGrid): void {
  for (let y = 1; y < GRID_SIZE; y += 2) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (x === grid.boss.x && y === grid.boss.y) continue
      setCell(grid, { x, y }, CellType.Wall)
    }
  }
  for (let y = 1; y < GRID_SIZE; y += 2) {
    const x = y % 4 === 1 ? GRID_SIZE - 1 : 0
    if (x === grid.boss.x && y === grid.boss.y) continue
    setCell(grid, { x, y }, CellType.Empty)
  }
}

describe('dungeon grid', () => {
  it('stores 64x64 logic cells and maps four-by-four cells to a visible tile', () => {
    const grid = createDungeonGrid()
    expect(grid.cells).toHaveLength(4096)
    expect(VISIBLE_TILE_SIZE).toBe(16)
    expect(LOGIC_CELLS_PER_VISIBLE_TILE).toBe(4)
    expect(VISIBLE_TILE_SIZE ** 2 * LOGIC_CELLS_PER_VISIBLE_TILE ** 2).toBe(
      grid.cells.length,
    )
  })

  it('findet den direkten Weg durch das leere Raster', () => {
    const result = findPath(createDungeonGrid())
    expect(result.mode).toBe('reachable')
    expect(result.path).toHaveLength(127)
    // Bewegungspunkte sind Schritte: 63 nach rechts, 63 nach unten.
    expect(result.movementCost).toBe(126)
  })

  it('führt eine Platzierungsmarkierung wie Boden, ohne Umweg', () => {
    // Bis zum 2026-09-29 kostete diese Zelle vier Punkte statt einen und die
    // Route wich ihr aus. Sie markiert nur noch einen Bereich; der Weg über sie
    // ist der direkte.
    const grid = createDungeonGrid()
    carveStraightRoute(grid)
    setCell(grid, { x: 1, y: 0 }, CellType.Placement)
    const placement = findPath(grid)
    expect(placement.mode).toBe('reachable')
    expect(placement.movementCost).toBe(126)
    expect(placement.path).toContainEqual({ x: 1, y: 0 })

    // Gegenprobe: eine Wand an derselben Stelle erzwingt den vollen Umweg.
    const walled = createDungeonGrid()
    carveStraightRoute(walled)
    setCell(walled, { x: 1, y: 0 }, CellType.Wall)
    expect(findPath(walled).mode).toBe('unreachable')
  })

  it('liefert für dasselbe Raster denselben Weg', () => {
    // Die Breitensuche entscheidet Gleichstand über die feste Nachbarreihenfolge
    // und eine FIFO-Warteschlange; zwei Läufe müssen denselben Weg ergeben.
    const grid = createDungeonGrid()
    carveStraightRoute(grid)
    setCell(grid, { x: 1, y: 0 }, CellType.Placement)
    expect(findPath(grid).path).toEqual(findPath(grid).path)
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

  it('gibt keine Route zurück, die mehr Schritte hat als das Raster Zellen', () => {
    // Spawn und Boss liegen an den Enden des Zickzacks; die Vorgaben (0|0) und
    // (63|63) erreichen das linke Ende nicht.
    const grid = createDungeonGrid({ x: 0, y: 0 }, { x: 0, y: GRID_SIZE - 1 })
    carveFullWidthRoute(grid)

    const result = findPath(grid)

    // 32 offene Zeilen à 64 Zellen plus 32 Verbinder: kein Schritt fehlt.
    expect(result.path).toHaveLength(2080)
    // `ROUTE_SLOTS` in `combat/actions.ts` trennt Takt und Routenschritt mit der
    // Zahl der Rasterzellen. Der Trenner trägt, weil keine Route eine Zelle
    // zweimal betritt und damit höchstens so viele Schritte hat wie das Raster
    // Zellen: 2079 Schritte, größter `routeIndex` 2079.
    expect(result.path.length).toBeLessThanOrEqual(grid.cells.length)
  })
})
