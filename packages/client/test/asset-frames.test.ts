import { CellType } from '@floor/sim-core'
import { describe, expect, it } from 'vitest'
import {
  ASSET_MANIFEST,
  type AssetId,
  type AssetSheet,
  tileFrame,
} from '../src/render/assets'
import {
  cellSeed,
  MATERIALS,
  materialById,
  pickVariant,
  TILES,
  WORLD_CELL_PX,
} from '../src/world'

/**
 * Pinned die Naht zwischen Materialvariante und Frame im Spriteblatt.
 *
 * Der Fehler, den diese Datei verhindert, ist im Repo schon einmal passiert:
 * Ein Index aus einer anderen Menge zählt die gefilterte. Ein Test, der die
 * Naht nicht prüft, findet ihn nicht — der Typecheck auch nicht.
 */

const DUNGEON_FLOOR = 'dungeon.floor.'
const DUNGEON_WALL = 'dungeon.wall.'

function materialIdOf(id: AssetId): string {
  return id.startsWith(DUNGEON_FLOOR)
    ? id.slice(DUNGEON_FLOOR.length)
    : id.slice(DUNGEON_WALL.length)
}

function floorIds(): AssetId[] {
  return Object.keys(ASSET_MANIFEST).filter(
    (id) => id.startsWith(DUNGEON_FLOOR) || id.startsWith(DUNGEON_WALL),
  ) as AssetId[]
}

describe('Dungeon-Blätter', () => {
  it('decken genau die Materialien ab, die es im Spiel gibt', () => {
    const declared = floorIds()
      .filter((id) => id.startsWith(DUNGEON_FLOOR))
      .map((id) => id.slice(DUNGEON_FLOOR.length))
      .sort()
    expect(declared).toEqual(Object.keys(MATERIALS).sort())
  })

  it('tragen so viele Frames, wie das Material Varianten hat', () => {
    for (const id of floorIds()) {
      const sheet = ASSET_MANIFEST[id] as AssetSheet
      // Die Wand teilt sich die Variantenzahl ihres Materials: Es gibt in
      // `world/tiles.ts` genau eine Wand, und sie ist aus Stein.
      expect(sheet.variants).toBe(materialById(materialIdOf(id)).variants)
    }
  })

  it('nimmt die Kantenlänge der Logikzelle als Frame-Breite', () => {
    for (const id of floorIds()) {
      expect(ASSET_MANIFEST[id]?.frameWidth).toBe(WORLD_CELL_PX)
    }
  })

  it('leitet die Wandhöhe aus der Tile-Definition, statt sie zu setzen', () => {
    expect(ASSET_MANIFEST['dungeon.wall.stone']?.height).toBe(
      WORLD_CELL_PX + TILES[CellType.Wall].height,
    )
  })

  it('verlangt ausschliesslich lokal ausgelieferte Blätter', () => {
    for (const id of floorIds()) {
      const src = ASSET_MANIFEST[id]?.src ?? ''
      expect(src.startsWith('/assets/')).toBe(true)
      expect(src).not.toMatch(/^https?:/)
    }
  })
})

describe('Frame-Auswahl', () => {
  /** Ein Blatt in der Hand, so breit wie das echte Steinblatt. */
  const sheetFor = (variants: number): ReadonlyMap<string, never> =>
    new Map([
      [
        'dungeon.floor.stone',
        {
          source: { scaleMode: 'nearest' },
          width: variants * WORLD_CELL_PX,
          height: WORLD_CELL_PX,
        },
      ],
    ]) as never

  it('liefert ohne geladene Textur null, damit der Fallback greift', () => {
    expect(tileFrame(new Map(), 'dungeon.floor.stone', 0)).toBeNull()
  })

  it('liefert null bei einem Blatt, das zu kurz ist', () => {
    // `variants: 8` steht im Manifest, das Blatt trägt nur drei Frames: Die
    // Datei ist veraltet, und der Fallback ist die ehrliche Antwort.
    expect(tileFrame(sheetFor(3), 'dungeon.floor.stone', 7)).toBeNull()
  })

  it('schneidet den Frame, den der Variantenindex verlangt', () => {
    const texture = tileFrame(sheetFor(8), 'dungeon.floor.stone', 5)
    expect(texture?.frame?.x).toBe(5 * WORLD_CELL_PX)
  })

  it('liefert für jede Zelle den Frame, den ihre Variante verlangt', () => {
    // Der eigentliche Naht-Test: Der Index kommt aus `pickVariant` über dem
    // Zell-Seed, nicht aus einer gefilterten Liste. Wandert der Index auf eine
    // andere Menge, wird genau dieser Fall rot.
    const stone = materialById('stone')
    for (let y = 0; y < 64; y += 1) {
      for (let x = 0; x < 64; x += 1) {
        const variant = pickVariant(stone, cellSeed({ x, y }))
        const texture = tileFrame(
          sheetFor(stone.variants),
          'dungeon.floor.stone',
          variant,
        )
        expect(texture?.frame?.x).toBe(variant * WORLD_CELL_PX)
      }
    }
  })

  it('bildet einen negativen Variantenindex auf ein gültiges Frame ab', () => {
    expect(tileFrame(sheetFor(8), 'dungeon.floor.stone', -1)?.frame?.x).toBe(
      7 * WORLD_CELL_PX,
    )
  })
})
