import {
  GRID_SIZE,
  LOGIC_CELLS_PER_VISIBLE_TILE,
  type Point,
} from '@floor/sim-core'

/**
 * Kantenlänge eines sichtbaren Tiles in Weltpixeln.
 *
 * Reine Präsentation: Die Simulation kennt keine Pixel. Alle Renderer- und
 * Pointer-Systeme lesen ihre Skalierung ausschließlich hier, damit Kamera,
 * Hit-Test und Layout dieselbe Zahl benutzen.
 */
export const WORLD_TILE_PX = 32

/** Kantenlänge einer Logikzelle in Weltpixeln. */
export const WORLD_CELL_PX = WORLD_TILE_PX / LOGIC_CELLS_PER_VISIBLE_TILE

/** Kantenlänge der kompletten 64×64-Welt in Weltpixeln. */
export const WORLD_SIZE_PX = GRID_SIZE * WORLD_CELL_PX

export interface WorldPoint {
  x: number
  y: number
}

/** Stabile Zahl pro Logikzelle — Grundlage deterministischer Materialvarianten. */
export function cellSeed(point: Point): number {
  return (point.y * GRID_SIZE + point.x) >>> 0
}

/** Linke obere Weltecke einer Logikzelle. */
export function cellToWorld(point: Point): WorldPoint {
  return { x: point.x * WORLD_CELL_PX, y: point.y * WORLD_CELL_PX }
}

/** Weltkoordinate der Fußmitte eines Objekts auf dieser Logikzelle. */
export function cellFoot(point: Point): WorldPoint {
  return {
    x: point.x * WORLD_CELL_PX + WORLD_CELL_PX / 2,
    y: point.y * WORLD_CELL_PX + WORLD_CELL_PX,
  }
}

export function clampCell(value: number): number {
  if (value < 0) return 0
  if (value >= GRID_SIZE) return GRID_SIZE - 1
  return value
}

/** Weltecke → Logikzelle, geklemmt auf das Raster. */
export function worldToCell(world: WorldPoint): Point {
  return {
    x: clampCell(Math.floor(world.x / WORLD_CELL_PX)),
    y: clampCell(Math.floor(world.y / WORLD_CELL_PX)),
  }
}
