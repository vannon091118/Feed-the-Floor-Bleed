import { CellType, type CellTypeValue } from '@floor/sim-core'
import {
  MATERIAL_ARCANE,
  MATERIAL_MOSS,
  MATERIAL_SOIL,
  MATERIAL_STONE,
} from './materials'

/**
 * Präsentationssicht einer Logikzelle.
 *
 * `CellType` bleibt die einzige Spielwahrheit. Diese Deskriptoren mappen ihn
 * rein optisch: Höhe erzeugt Fake-3D, `occludes` steuert Occlusion, `material`
 * wählt die Texturfamilie. Editor und Pixi lesen dieselbe Tabelle.
 */
export interface TileDescriptor {
  cell: CellTypeValue
  materialId: string
  walkable: boolean
  /** Künstliche Höhe in Weltpixeln — kein Spielwert, nur Darstellung. */
  height: number
  occludes: boolean
  marker: 'none' | 'spawn' | 'boss'
}

export const TILES: Record<CellTypeValue, TileDescriptor> = {
  [CellType.Empty]: {
    cell: CellType.Empty,
    materialId: MATERIAL_SOIL.id,
    walkable: true,
    height: 0,
    occludes: false,
    marker: 'none',
  },
  [CellType.Wall]: {
    cell: CellType.Wall,
    materialId: MATERIAL_STONE.id,
    walkable: false,
    height: 22,
    occludes: true,
    marker: 'none',
  },
  [CellType.Trap]: {
    cell: CellType.Trap,
    materialId: MATERIAL_ARCANE.id,
    walkable: true,
    height: 0,
    occludes: false,
    marker: 'none',
  },
  [CellType.Spawn]: {
    cell: CellType.Spawn,
    materialId: MATERIAL_MOSS.id,
    walkable: true,
    height: 0,
    occludes: false,
    marker: 'spawn',
  },
  [CellType.Boss]: {
    cell: CellType.Boss,
    materialId: MATERIAL_STONE.id,
    walkable: true,
    height: 0,
    occludes: false,
    marker: 'boss',
  },
}

export function tileFor(cell: CellTypeValue): TileDescriptor {
  return TILES[cell]
}
