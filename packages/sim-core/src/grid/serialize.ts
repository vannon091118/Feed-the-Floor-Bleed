import type { DungeonGridPayload } from '@floor/contracts'
import type { CellTypeValue, DungeonGrid } from './types'
import { GRID_SIZE } from './types'

const CELL_COUNT = GRID_SIZE * GRID_SIZE

/**
 * Contract-Payload → Laufzeit-Grid.
 *
 * Der Contract transportiert `cells` als Array aus Zelltyp-Literalen, die
 * Engine rechnet in einem `Uint8Array`. Die Brücke kopiert bewusst, damit ein
 * eingefrorener Snapshot nachträglich nicht verändert werden kann.
 */
export function toDungeonGrid(payload: DungeonGridPayload): DungeonGrid {
  if (payload.cells.length !== CELL_COUNT)
    throw new Error(`Dungeon-Payload braucht genau ${CELL_COUNT} Zellen`)
  const cells = new Uint8Array(CELL_COUNT)
  for (let index = 0; index < CELL_COUNT; index += 1)
    cells[index] = payload.cells[index]
  return { cells, spawn: { ...payload.spawn }, boss: { ...payload.boss } }
}

/** Laufzeit-Grid → Contract-Payload, strikt JSON-serialisierbar. */
export function fromDungeonGrid(grid: DungeonGrid): DungeonGridPayload {
  if (grid.cells.length !== CELL_COUNT)
    throw new Error(`Dungeon-Grid braucht genau ${CELL_COUNT} Zellen`)
  const cells: DungeonGridPayload['cells'] = []
  for (let index = 0; index < CELL_COUNT; index += 1)
    cells.push(grid.cells[index] as CellTypeValue)
  return { cells, spawn: { ...grid.spawn }, boss: { ...grid.boss } }
}
