import { indexOf, neighbors, pointOf } from './grid'
import {
  CellType,
  type DungeonGrid,
  GRID_SIZE,
  type PathResult,
  type Point,
} from './types'

const CELL_COUNT = GRID_SIZE * GRID_SIZE

/**
 * Kürzester Weg in Schritten vom Spawn zum Boss, oder `undefined`.
 *
 * Boden, Spawn, Boss und Platzierungsmarkierungen sind gleich teuer, Wände
 * sind unpassierbar. Deshalb ist das eine Breitensuche und keine gewichtete
 * Suche: Mit der Falle ist am 2026-09-29 auch ihr Kostenzuschlag entfallen,
 * die Placement Tile markiert nur noch. Die alte Suche brauchte dafür einen
 * Heap, ein Umwegbudget und einen Rückfallzweig; alle drei hatten nur diese
 * eine Aufgabe und sind mit ihr verschwunden.
 *
 * Die Warteschlange ist FIFO und die Nachbarreihenfolge fest, damit derselbe
 * Dungeon immer denselben Weg liefert.
 */
function shortestPath(grid: DungeonGrid): Point[] | undefined {
  const start = indexOf(grid.spawn)
  const target = indexOf(grid.boss)
  const parent = new Int32Array(CELL_COUNT).fill(-1)
  const seen = new Uint8Array(CELL_COUNT)
  const queue = new Int32Array(CELL_COUNT)
  let head = 0
  let tail = 0
  queue[tail++] = start
  seen[start] = 1

  while (head < tail) {
    const current = queue[head++]
    if (current === target) break
    for (const index of neighbors(current)) {
      if (seen[index]) continue
      if (grid.cells[index] === CellType.Wall) continue
      seen[index] = 1
      parent[index] = current
      queue[tail++] = index
    }
  }

  if (!seen[target]) return undefined
  const path: Point[] = []
  for (let index = target; index !== -1; index = parent[index])
    path.push(pointOf(index))
  return path.reverse()
}

export function findPath(grid: DungeonGrid): PathResult {
  const path = shortestPath(grid)
  if (!path)
    return {
      mode: 'unreachable',
      path: [],
      movementCost: Number.POSITIVE_INFINITY,
    }
  return { mode: 'reachable', path, movementCost: path.length - 1 }
}

export function hasValidRoute(grid: DungeonGrid): boolean {
  return shortestPath(grid) !== undefined
}
