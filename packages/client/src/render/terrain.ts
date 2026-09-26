import { Container, Sprite } from 'pixi.js'
import {
  cellFoot,
  cellToWorld,
  materialById,
  type TerrainPatch,
  type TerrainTile,
  WORLD_CELL_PX,
} from '../world'
import { depthValue } from './depth'
import { materialFilter } from './filters'
import type { VisualRuntime } from './runtime'
import { tileTexture, wallTexture } from './tile-atlas'

export interface TerrainView {
  apply(patch: TerrainPatch | null): void
  dispose(): void
}

/**
 * Boden und Blöcke als persistente Sprites.
 *
 * Boden liegt in der flachen Terrain-Ebene, occludierende Zellen wandern in die
 * sortierbare Welt-Ebene. Dadurch verdeckt eine Wand einen Actor, der hinter
 * ihr steht, ohne dass ein Actor-Sprite eigenes Tiefenwissen braucht.
 */
export function createTerrainView(runtime: VisualRuntime): TerrainView {
  const floors = new Map<number, Sprite>()
  const blocks = new Map<number, Sprite>()
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

  const place = (tile: TerrainTile): void => {
    discard(tile.index)
    const foot = cellFoot(tile.cell)
    if (tile.occludes) {
      const sprite = new Sprite(
        wallTexture(tile.materialId, tile.variant, tile.height),
      )
      sprite.anchor.set(0.5, 1)
      sprite.x = foot.x
      sprite.y = foot.y
      sprite.width = WORLD_CELL_PX
      sprite.height = WORLD_CELL_PX + tile.height
      sprite.zIndex = depthValue(foot.y, tile.height)
      runtime.layers.world.addChild(sprite)
      blocks.set(tile.index, sprite)
    } else {
      const sprite = new Sprite(tileTexture(tile.materialId, tile.variant))
      const origin = cellToWorld(tile.cell)
      sprite.width = WORLD_CELL_PX
      sprite.height = WORLD_CELL_PX
      sprite.x = origin.x
      sprite.y = origin.y
      floorLayer(tile.materialId).addChild(sprite)
      floors.set(tile.index, sprite)
    }
  }

  return {
    apply(patch) {
      if (!patch) return
      if (patch.reset) {
        for (const index of [...floors.keys(), ...blocks.keys()]) discard(index)
      }
      for (const tile of patch.changed) place(tile)
    },
    dispose() {
      for (const index of [...floors.keys(), ...blocks.keys()]) discard(index)
      for (const container of materialLayers.values()) {
        container.parent?.removeChild(container)
        container.destroy({ children: true })
      }
      materialLayers.clear()
    },
  }
}
