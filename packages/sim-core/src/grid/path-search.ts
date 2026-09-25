import { MinHeap, type SearchNode } from './min-heap'
import {
  CellType,
  type DungeonGrid,
  GRID_SIZE,
  type PathResult,
  type Point,
} from './types'

const NEIGHBORS = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
] as const
const MAX_INT = 0x7fffffff

function indexOf(point: Point): number {
  return point.y * GRID_SIZE + point.x
}

function pointOf(index: number): Point {
  return { x: index % GRID_SIZE, y: Math.floor(index / GRID_SIZE) }
}

function cellCost(grid: DungeonGrid, point: Point): number {
  const cell = grid.cells[indexOf(point)]
  if (cell === CellType.Wall) return Number.POSITIVE_INFINITY
  if (cell === CellType.Trap) return 4
  if (cell === CellType.Spawn || cell === CellType.Boss) return 0
  return 1
}

export function manhattan(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

export function search(
  grid: DungeonGrid,
  maxCost: number,
  preferSteps: boolean,
): SearchNode | undefined {
  const start = indexOf(grid.spawn)
  const target = indexOf(grid.boss)
  const bestCost = new Int32Array(GRID_SIZE * GRID_SIZE)
  const bestSteps = new Int32Array(GRID_SIZE * GRID_SIZE)
  const closed = new Uint8Array(GRID_SIZE * GRID_SIZE)
  const heap = new MinHeap(preferSteps ? 'steps-first' : 'cost-first')
  bestCost.fill(MAX_INT)
  bestSteps.fill(MAX_INT)
  bestCost[start] = 0
  bestSteps[start] = 0
  let order = 0
  heap.push({
    index: start,
    cost: 0,
    steps: 0,
    order,
    parent: undefined,
  })

  while (true) {
    const current = heap.pop()
    if (!current) return undefined
    if (closed[current.index]) continue
    closed[current.index] = 1
    if (current.index === target) return current

    const currentPoint = pointOf(current.index)
    for (const direction of NEIGHBORS) {
      const nextPoint = {
        x: currentPoint.x + direction.x,
        y: currentPoint.y + direction.y,
      }
      if (
        nextPoint.x < 0 ||
        nextPoint.x >= GRID_SIZE ||
        nextPoint.y < 0 ||
        nextPoint.y >= GRID_SIZE
      )
        continue
      const nextIndex = indexOf(nextPoint)
      if (closed[nextIndex]) continue
      const nextCost = current.cost + cellCost(grid, nextPoint)
      if (!Number.isFinite(nextCost) || nextCost > maxCost) continue
      const nextSteps = current.steps + 1
      const improves = preferSteps
        ? nextSteps < bestSteps[nextIndex]
        : nextCost < bestCost[nextIndex] ||
          (nextCost === bestCost[nextIndex] && nextSteps < bestSteps[nextIndex])
      if (!improves) continue
      bestCost[nextIndex] = nextCost
      bestSteps[nextIndex] = nextSteps
      heap.push({
        index: nextIndex,
        cost: nextCost,
        steps: nextSteps,
        order: order++,
        parent: current,
      })
    }
  }
}

export function reconstructPath(
  node: SearchNode,
): Omit<PathResult, 'mode' | 'detourCost'> {
  const path: Point[] = []
  let current: SearchNode | undefined = node
  while (current) {
    path.push(pointOf(current.index))
    current = current.parent
  }
  path.reverse()
  return { path, movementCost: node.cost }
}
