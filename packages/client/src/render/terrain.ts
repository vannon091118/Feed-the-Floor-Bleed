import { Container, Sprite } from 'pixi.js'
import {
  cellFoot,
  cellToWorld,
  materialById,
  type TerrainPatch,
  type TerrainTile,
  WORLD_CELL_PX,
} from '../world'
import { optionalTexture } from './assets'
import { depthValue } from './depth'
import { materialFilter } from './filters'
import type { DungeonRenderMode } from './modes'
import type { VisualRuntime } from './runtime'
import { tileTexture, wallTexture } from './tile-atlas'

export interface TerrainView {
  apply(patch: TerrainPatch | null): void
  setMode(mode: DungeonRenderMode): void
  dispose(): void
}

/**
 * Boden und Blöcke als persistente Sprites.
 *
 * Editor und Raid konsumieren dieselben Terrain-Deskriptoren. Der Editor legt
 * alle Zellen flach in ein Raster; im Raid wandern occludierende Wände in die
 * sortierbare Welt-Ebene. Fehlende lokale Grafiken behalten die Canvas-Textur.
 */
export function createTerrainView(
  runtime: VisualRuntime,
  mode: DungeonRenderMode,
): TerrainView {
  let activeMode = mode
  const floors = new Map<number, Sprite>()
  const blocks = new Map<number, Sprite>()
  const tiles = new Map<number, TerrainTile>()
  const materialLayers = new Map<string, Container>()

  const floorLayer = (materialId: string): Container => {
    const cached = materialLayers.get(materialId)
    if (cached) return cached
    const container = new Container()
    container.filters = [materialFilter(materialById(materialId))]
    runtime.layers.terrain.addChild(container)
    materialLayers.set(materialId, container)
    return container
  }

  const discard = (index: number): void => {
    const floor = floors.get(index)
    if (floor) {
      floor.parent?.removeChild(floor)
      floor.destroy()
      floors.delete(index)
    }
    const block = blocks.get(index)
    if (block) {
      block.parent?.removeChild(block)
      block.destroy()
      blocks.delete(index)
    }
  }

  const floorTexture = (materialId: string, variant: number) => {
    const local = optionalTexture(runtime.assets, `dungeon.floor.${materialId}`)
    const texture = local ?? tileTexture(materialId, variant)
    texture.source.scaleMode = 'nearest'
    return texture
  }

  const place = (tile: TerrainTile): void => {
    discard(tile.index)
    const foot = cellFoot(tile.cell)
    if (tile.occludes && activeMode === 'raid') {
      const local = optionalTexture(
        runtime.assets,
        `dungeon.wall.${tile.materialId}`,
      )
      const texture =
        local ?? wallTexture(tile.materialId, tile.variant, tile.height)
      texture.source.scaleMode = 'nearest'
      const sprite = new Sprite(texture)
      sprite.anchor.set(0.5, 1)
      sprite.x = foot.x
      sprite.y = foot.y
      sprite.width = WORLD_CELL_PX
      sprite.height = WORLD_CELL_PX + tile.height
      sprite.zIndex = depthValue(foot.y, tile.height)
      runtime.layers.world.addChild(sprite)
      blocks.set(tile.index, sprite)
      return
    }

    // Im flachen Editor werden Wände als Stein-Zellen gerendert; die
    // Editor-Overlay-Ebene kennzeichnet sie klar, ohne Fake-3D-Höhe.
    const materialId = tile.occludes ? 'stone' : tile.materialId
    const sprite = new Sprite(floorTexture(materialId, tile.variant))
    const origin = cellToWorld(tile.cell)
    sprite.width = WORLD_CELL_PX
    sprite.height = WORLD_CELL_PX
    sprite.x = origin.x
    sprite.y = origin.y
    floorLayer(materialId).addChild(sprite)
    floors.set(tile.index, sprite)
  }

  return {
    apply(patch) {
      if (!patch) return
      if (patch.reset) {
        for (const index of [...floors.keys(), ...blocks.keys()]) discard(index)
        tiles.clear()
      }
      for (const tile of patch.changed) {
        place(tile)
        tiles.set(tile.index, tile)
      }
    },
    setMode(nextMode) {
      if (activeMode === nextMode) return
      activeMode = nextMode
      for (const index of [...floors.keys(), ...blocks.keys()]) discard(index)
      for (const tile of tiles.values()) place(tile)
    },
    dispose() {
      for (const index of [...floors.keys(), ...blocks.keys()]) discard(index)
      for (const container of materialLayers.values()) {
        container.parent?.removeChild(container)
        container.destroy({ children: true })
      }
      materialLayers.clear()
      tiles.clear()
    },
  }
}
