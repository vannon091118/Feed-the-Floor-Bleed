import type { Texture } from 'pixi.js'
import { WORLD_SIZE_PX, WORLD_TILE_PX } from '../world'
import { drawingContext, textureOf } from './canvas'

let cached: Texture | null = null

/** Dünne 16×16-Gridlinien über dieselben sichtbaren Tile-Maße wie der Editor. */
export function editorGridTexture(): Texture {
  if (cached) return cached
  const { canvas, ctx } = drawingContext(WORLD_SIZE_PX)
  ctx.strokeStyle = 'rgba(235, 228, 205, 0.42)'
  ctx.lineWidth = 1
  for (let position = 0; position <= WORLD_SIZE_PX; position += WORLD_TILE_PX) {
    ctx.beginPath()
    ctx.moveTo(position + 0.5, 0)
    ctx.lineTo(position + 0.5, WORLD_SIZE_PX)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, position + 0.5)
    ctx.lineTo(WORLD_SIZE_PX, position + 0.5)
    ctx.stroke()
  }
  cached = textureOf(canvas)
  return cached
}
