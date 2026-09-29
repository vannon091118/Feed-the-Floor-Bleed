import { CellType } from '@floor/sim-core'
import { Assets, Rectangle, Texture } from 'pixi.js'
import { TILES, WORLD_CELL_PX } from '../world'

export type AssetId =
  | 'dungeon.floor.arcane'
  | 'dungeon.floor.moss'
  | 'dungeon.floor.soil'
  | 'dungeon.floor.stone'
  | 'dungeon.floor.wood'
  | 'dungeon.wall.stone'
  | 'village.ground'
  | 'village.tree'
  | 'village.building.guild'
  | 'village.building.hall'
  | 'village.building.house'
  | 'village.building.workshop'

/**
 * Ein ausgeliefertes Blatt: ein Streifen gleich großer Frames in einer Reihe.
 *
 * `frameWidth` ist die Weltbreite einer Kachel, `height` ihre Höhe — bei einer
 * Wand kommt die künstliche Höhe aus `world/tiles.ts` dazu, weil das Sprite
 * dort gestreckt wird. `variants` ist die Frame-Anzahl; sie muss zur Material-
 * definition in `world/materials.ts` passen, sonst fehlt am Ende eine Kachel
 * und der Boden zeigt still die falsche Variante.
 */
export interface AssetSheet {
  src: string
  frameWidth: number
  height: number
  variants: number
}

/**
 * Nur selbst erstellte, lokal ausgelieferte Assets eintragen.
 *
 * Die Dungeon-Blätter erzeugt `pnpm --filter @floor/client assets` aus den
 * Stilregeln in `tools/draw.mjs`; die Dorf-Einträge bleiben leer, bis ihre
 * eigenen Blätter gebaut sind. Externe URLs und Referenzbilder gehören nicht
 * hinein — E3 und E6 des Visual-Grundsatzes schließen das für.
 */
export const ASSET_MANIFEST: Readonly<Partial<Record<AssetId, AssetSheet>>> = {
  'dungeon.floor.arcane': {
    src: '/assets/dungeon_floor_arcane.png',
    frameWidth: WORLD_CELL_PX,
    height: WORLD_CELL_PX,
    variants: 5,
  },
  'dungeon.floor.moss': {
    src: '/assets/dungeon_floor_moss.png',
    frameWidth: WORLD_CELL_PX,
    height: WORLD_CELL_PX,
    variants: 5,
  },
  'dungeon.floor.soil': {
    src: '/assets/dungeon_floor_soil.png',
    frameWidth: WORLD_CELL_PX,
    height: WORLD_CELL_PX,
    variants: 6,
  },
  'dungeon.floor.stone': {
    src: '/assets/dungeon_floor_stone.png',
    frameWidth: WORLD_CELL_PX,
    height: WORLD_CELL_PX,
    variants: 8,
  },
  'dungeon.floor.wood': {
    src: '/assets/dungeon_floor_wood.png',
    frameWidth: WORLD_CELL_PX,
    height: WORLD_CELL_PX,
    variants: 4,
  },
  'dungeon.wall.stone': {
    src: '/assets/dungeon_wall_stone.png',
    frameWidth: WORLD_CELL_PX,
    // Die Wandhöhe kommt aus der Tile-Definition, weil der Renderer das
    // Sprite genau um diesen Betrag streckt. Eine eigene Zahl hier hieße: ein
    // geänderter Höhenwert verschiebt die Deckplatte, ohne dass es jemand merkt.
    height: WORLD_CELL_PX + TILES[CellType.Wall].height,
    variants: 8,
  },
}

/**
 * Lädt optionale lokale Texturen und überspringt fehlende/defekte Dateien.
 *
 * Rückgabe enthält nur erfolgreiche Texturen; Atlas-Owner verwenden für
 * fehlende IDs weiterhin ihre deterministischen Canvas-Texturen.
 */
export async function loadAssetTextures(
  manifest: Readonly<Partial<Record<AssetId, AssetSheet>>> = ASSET_MANIFEST,
): Promise<ReadonlyMap<string, Texture>> {
  const loaded = await Promise.all(
    Object.entries(manifest).map(async ([id, sheet]) => {
      if (!sheet?.src.startsWith('/assets/')) return null
      try {
        const texture = await Assets.load<Texture>(sheet.src)
        if (!(texture instanceof Texture)) return null
        texture.source.scaleMode = 'nearest'
        return [id, texture] as const
      } catch {
        return null
      }
    }),
  )
  return new Map(loaded.filter((entry) => entry !== null))
}

export function optionalTexture(
  textures: ReadonlyMap<string, Texture>,
  id: string,
): Texture | null {
  return textures.get(id) ?? null
}

/**
 * Schneidet den Frame einer Variante aus dem Blatt.
 *
 * Der Index kommt aus `tile.variant`, also aus `pickVariant` über dem Zell-Seed.
 * Er darf nicht aus einer gefilterten Liste stammen: ein Index aus einer
 * anderen Menge zählt die gefilterte, und niemand sieht den Fehler, außer er
 * prüft die Naht. `test/asset-frames.test.ts` pinnt genau das.
 *
 * Liegt die Variante außerhalb des Blatts, kommt `null` — der Aufrufer fällt
 * auf die prozedurale Textur zurück, statt ein falsches Bild zu zeigen.
 */
export function tileFrame(
  textures: ReadonlyMap<string, Texture>,
  id: string,
  variant: number,
): Texture | null {
  const texture = textures.get(id)
  const sheet = ASSET_MANIFEST[id as AssetId]
  if (!texture || !sheet) return null
  const index = ((variant % sheet.variants) + sheet.variants) % sheet.variants
  const x = index * sheet.frameWidth
  // Das Blatt trägt weniger Frames, als das Manifest behauptet: dann ist die
  // Datei veraltet und der Fallback ist die ehrliche Antwort.
  if (x + sheet.frameWidth > texture.width || sheet.height > texture.height) {
    return null
  }
  return new Texture({
    source: texture.source,
    frame: new Rectangle(x, 0, sheet.frameWidth, sheet.height),
  })
}
