import { manhattan, reconstructPath, search } from './path-search'
import type { DungeonGrid, PathResult } from './types'

export function findPath(grid: DungeonGrid, maxDetourPoints = 5): PathResult {
  if (!Number.isInteger(maxDetourPoints) || maxDetourPoints < 0) {
    throw new Error('maxDetourPoints must be a non-negative integer')
  }
  const baseline = Math.max(0, manhattan(grid.spawn, grid.boss) - 1)
  const bounded = search(grid, baseline + maxDetourPoints, true)
  if (bounded) {
    const path = reconstructPath(bounded)
    return {
      ...path,
      mode: 'within-budget',
      detourCost: Math.max(0, bounded.cost - baseline),
    }
  }
  const fallback = search(grid, Number.POSITIVE_INFINITY, false)
  if (!fallback)
    return {
      mode: 'unreachable',
      path: [],
      movementCost: Number.POSITIVE_INFINITY,
      detourCost: Number.POSITIVE_INFINITY,
    }
  const path = reconstructPath(fallback)
  return {
    ...path,
    mode: 'trap-fallback',
    detourCost: Math.max(0, fallback.cost - baseline),
  }
}

export function hasValidRoute(grid: DungeonGrid, maxDetourPoints = 5): boolean {
  return findPath(grid, maxDetourPoints).mode !== 'unreachable'
}
