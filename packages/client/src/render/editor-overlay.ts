import type { DungeonGrid, PathResult } from '@floor/sim-core'
import {
  CellType,
  getCell,
  LOGIC_CELLS_PER_VISIBLE_TILE,
  VISIBLE_TILE_SIZE,
} from '@floor/sim-core'
import { Graphics } from 'pixi.js'
import { tileMarker, visibleRouteTiles } from '../dungeon-editor/model'
import { WORLD_TILE_PX } from '../world'
import type { VisualRuntime } from './runtime'

export interface EditorOverlay {
  update(grid: DungeonGrid, route: PathResult): void
  setVisible(visible: boolean): void
  dispose(): void
}

/** Präsentationsoverlay; Grid-/Routen-Owner bleiben Editor und Core. */
export function createEditorOverlay(runtime: VisualRuntime): EditorOverlay {
  const graphics = new Graphics()
  runtime.layers.editor.addChild(graphics)

  return {
    update(grid, route) {
      graphics.clear()
      const routeTiles = visibleRouteTiles(route)
      for (let tileY = 0; tileY < VISIBLE_TILE_SIZE; tileY += 1) {
        for (let tileX = 0; tileX < VISIBLE_TILE_SIZE; tileX += 1) {
          const index = tileY * VISIBLE_TILE_SIZE + tileX
          const cell = getCell(grid, {
            x: tileX * LOGIC_CELLS_PER_VISIBLE_TILE,
            y: tileY * LOGIC_CELLS_PER_VISIBLE_TILE,
          })
          const marker = tileMarker(grid, tileX, tileY)
          const x = tileX * WORLD_TILE_PX
          const y = tileY * WORLD_TILE_PX
          if (routeTiles.has(index)) {
            graphics.rect(x + 2, y + 2, WORLD_TILE_PX - 4, WORLD_TILE_PX - 4)
            graphics.fill({ color: 0xffd35b, alpha: 0.18 })
          }
          if (cell === CellType.Wall) {
            graphics.rect(x + 1, y + 1, WORLD_TILE_PX - 2, WORLD_TILE_PX - 2)
            graphics.stroke({ color: 0xe7d6b9, alpha: 0.42, width: 1 })
          }
          if (marker) {
            graphics.circle(x + WORLD_TILE_PX / 2, y + WORLD_TILE_PX / 2, 7)
            graphics.fill({ color: marker === 'boss' ? 0xf17762 : 0x7fe6a0 })
          }
        }
      }
    },
    setVisible(visible) {
      graphics.visible = visible
    },
    dispose() {
      graphics.parent?.removeChild(graphics)
      graphics.destroy()
    },
  }
}
