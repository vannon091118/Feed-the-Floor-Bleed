import type { Texture } from 'pixi.js'
import { WORLD_TILE_PX } from '../world'
import { drawingContext, textureOf } from './canvas'

let cached: Texture | null = null

/**
 * Ein Kachelfeld des Editor-Grids, genau so groß wie ein sichtbares Tile.
 *
 * Statt eines 2048×2048-Canvas, der 16 Megabyte Pixel Puffer belegt: Die Linien
 * sitzen auf dem Rand des Feldes, damit beim Kacheln keine Doppellinie entsteht
 * — die Kante rechts und unten gehört dem Feld, die Kante links und oben dem
 * Nachbarfeld. `editor-grid.ts` spannt die Textur als TilingSprite über die Welt.
 */
export function editorGridTexture(): Texture {
  if (cached) return cached
  const { canvas, ctx } = drawingContext(WORLD_TILE_PX)
  ctx.strokeStyle = 'rgba(235, 228, 205, 0.42)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(WORLD_TILE_PX - 0.5, 0)
  ctx.lineTo(WORLD_TILE_PX - 0.5, WORLD_TILE_PX)
  ctx.moveTo(0, WORLD_TILE_PX - 0.5)
  ctx.lineTo(WORLD_TILE_PX, WORLD_TILE_PX - 0.5)
  ctx.stroke()
  cached = textureOf(canvas)
  cached.source.scaleMode = 'nearest'
  return cached
}
