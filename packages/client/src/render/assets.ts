import { Assets, Texture } from 'pixi.js'

/**
 * Nur selbst erstellte, lokal ausgelieferte Assets eintragen.
 *
 * Das Manifest bleibt zunächst leer, bis passende Pixel-Art-Dateien vorliegen.
 * Externe URLs und Referenzbilder gehören nicht hinein.
 */
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

export const ASSET_MANIFEST: Readonly<Partial<Record<AssetId, string>>> = {}

/**
 * Lädt optionale lokale Texturen und überspringt fehlende/defekte Dateien.
 *
 * Rückgabe enthält nur erfolgreiche Texturen; Atlas-Owner verwenden für
 * fehlende IDs weiterhin ihre deterministischen Canvas-Texturen.
 */
export async function loadAssetTextures(
  manifest: Readonly<Partial<Record<AssetId, string>>> = ASSET_MANIFEST,
): Promise<ReadonlyMap<string, Texture>> {
  const loaded = await Promise.all(
    Object.entries(manifest).map(async ([id, source]) => {
      if (!source?.startsWith('/assets/')) return null
      try {
        const texture = await Assets.load<Texture>(source)
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
