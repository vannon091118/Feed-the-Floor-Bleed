import type { Point } from '@floor/sim-core'

/** Mappt jeden Präsentationsindex sicher auf dieselbe räumliche Route. */
export function routePointAt(path: readonly Point[], index: number): Point {
  if (path.length === 0) return { x: 0, y: 0 }
  return path[Math.min(Math.max(index, 0), path.length - 1)]
}
