import {
  type DungeonGrid,
  GRID_SIZE,
  type Point,
  getCell,
} from '@floor/sim-core'
import {
  TILES,
  type TerrainPatch,
  type TerrainTile,
  cellSeed,
  materialById,
  pickVariant,
} from '../world'

/** Liest das Grid einmal vollständig in Präsentationsdeskriptoren. */
export function buildTerrain(grid: DungeonGrid): TerrainTile[] {
  const tiles: TerrainTile[] = []
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const cell: Point = { x, y }
      const descriptor = TILES[getCell(grid, cell)]
      const seed = cellSeed(cell)
      tiles.push({
        index: y * GRID_SIZE + x,
        cell,
        materialId: descriptor.materialId,
        variant: pickVariant(materialById(descriptor.materialId), seed),
        height: descriptor.height,
        occludes: descriptor.occludes,
        seed,
      })
    }
  }
  return tiles
}

/**
 * Nur tatsächlich veränderte Zellen weiterreichen.
 *
 * Die Runtime baut dadurch beim Malen nicht die Welt neu, sondern tauscht
 * einzelne Texturen. `reset` markiert den ersten Aufbau oder eine Größenabweichung.
 */
export function diffTerrain(
  previous: TerrainTile[] | null,
  next: TerrainTile[],
): TerrainPatch {
  if (!previous || previous.length !== next.length) {
    return { reset: true, changed: next }
  }
  const changed: TerrainTile[] = []
  for (let index = 0; index < next.length; index += 1) {
    const before = previous[index]
    const after = next[index]
    if (
      before.materialId !== after.materialId ||
      before.variant !== after.variant ||
      before.height !== after.height
    ) {
      changed.push(after)
    }
  }
  return { reset: false, changed }
}
