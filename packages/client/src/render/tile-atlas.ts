import { createRng, nextBelow } from '@floor/sim-core'
import type { Texture } from 'pixi.js'
import {
  type MaterialDef,
  materialById,
  WORLD_CELL_PX,
  WORLD_TILE_PX,
} from '../world'
import { drawingContext, hex, textureOf } from './canvas'

const TEXTURE_PX = WORLD_TILE_PX * 2
const tileCache = new Map<string, Texture>()
const wallCache = new Map<string, Texture>()

function drawTile(material: MaterialDef, variant: number): Texture {
  const { canvas, ctx } = drawingContext(TEXTURE_PX)
  const rng = createRng((material.seedSalt * 131 + variant * 17 + 7) >>> 0)
  ctx.fillStyle = hex(material.base)
  ctx.fillRect(0, 0, TEXTURE_PX, TEXTURE_PX)
  const inset = 3 + nextBelow(rng, 3)
  ctx.fillStyle = hex(material.edge)
  ctx.beginPath()
  ctx.roundRect(inset, inset, TEXTURE_PX - inset * 2, TEXTURE_PX - inset * 2, 7)
  ctx.fill()
  ctx.fillStyle = hex(material.base)
  ctx.beginPath()
  ctx.roundRect(
    inset + 2,
    inset + 2,
    TEXTURE_PX - inset * 2 - 4,
    TEXTURE_PX - inset * 2 - 4,
    5,
  )
  ctx.fill()
  const shade = ctx.createLinearGradient(0, inset, 0, TEXTURE_PX - inset)
  shade.addColorStop(0, 'rgba(255,255,255,0.12)')
  shade.addColorStop(0.48, 'rgba(255,255,255,0)')
  shade.addColorStop(1, 'rgba(0,0,0,0.2)')
  ctx.fillStyle = shade
  ctx.beginPath()
  ctx.roundRect(
    inset + 2,
    inset + 2,
    TEXTURE_PX - inset * 2 - 4,
    TEXTURE_PX - inset * 2 - 4,
    5,
  )
  ctx.fill()
  ctx.fillStyle = hex(material.detail)
  const dots = 7 + nextBelow(rng, 8)
  for (let index = 0; index < dots; index += 1) {
    const x = inset + 4 + nextBelow(rng, TEXTURE_PX - inset * 2 - 8)
    const y = inset + 4 + nextBelow(rng, TEXTURE_PX - inset * 2 - 8)
    ctx.globalAlpha = 0.14 + nextBelow(rng, 24) / 100
    ctx.beginPath()
    ctx.ellipse(
      x,
      y,
      1 + nextBelow(rng, 4),
      1 + nextBelow(rng, 3),
      0,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
  ctx.globalAlpha = 1
  return textureOf(canvas)
}

/** Eine deterministische, reliefartige Bodenkachel pro Materialvariante. */
export function tileTexture(materialId: string, variant: number): Texture {
  const material = materialById(materialId)
  const key = `${materialId}#${variant % material.variants}`
  const cached = tileCache.get(key)
  if (cached) return cached
  const texture = drawTile(material, variant % material.variants)
  tileCache.set(key, texture)
  return texture
}

/** Frontfläche und beleuchtete Deckplatte für eine einzelne Fake-3D-Mauer. */
export function wallTexture(
  materialId: string,
  variant: number,
  height: number,
): Texture {
  const material = materialById(materialId)
  const key = `${materialId}#${variant % material.variants}@${height}`
  const cached = wallCache.get(key)
  if (cached) return cached
  const width = TEXTURE_PX
  const wallHeight = Math.round(
    ((WORLD_CELL_PX + height) * width) / WORLD_CELL_PX,
  )
  const { canvas, ctx } = drawingContext(width, wallHeight)
  const rng = createRng((material.seedSalt * 193 + variant * 29 + height) >>> 0)
  const bevel = Math.max(5, Math.round(width * 0.12))
  ctx.fillStyle = hex(material.edge)
  ctx.fillRect(0, 0, width, wallHeight)
  ctx.fillStyle = hex(material.base)
  ctx.fillRect(0, 0, width - bevel, wallHeight - bevel)
  const front = ctx.createLinearGradient(
    0,
    wallHeight - bevel,
    width,
    wallHeight,
  )
  front.addColorStop(0, hex(material.detail))
  front.addColorStop(1, hex(material.edge))
  ctx.fillStyle = front
  ctx.beginPath()
  ctx.moveTo(0, wallHeight - bevel)
  ctx.lineTo(width - bevel, wallHeight - bevel)
  ctx.lineTo(width, wallHeight)
  ctx.lineTo(bevel, wallHeight)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = hex(material.detail)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(width - bevel, 0)
  ctx.lineTo(width, bevel)
  ctx.lineTo(bevel, bevel)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 0.35
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(3, 3)
  ctx.lineTo(width - bevel - 2, 3)
  ctx.lineTo(width - 2, bevel - 2)
  ctx.stroke()
  ctx.globalAlpha = 0.18
  ctx.strokeStyle = hex(material.edge)
  for (let row = bevel + 5; row < wallHeight - bevel; row += 12) {
    const offset = nextBelow(rng, 12)
    ctx.beginPath()
    ctx.moveTo(offset, row)
    ctx.lineTo(width - bevel - 4, row)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  const shadow = ctx.createLinearGradient(0, bevel, 0, wallHeight - bevel)
  shadow.addColorStop(0, 'rgba(255,255,255,0.08)')
  shadow.addColorStop(1, 'rgba(0,0,0,0.28)')
  ctx.fillStyle = shadow
  ctx.fillRect(0, bevel, width - bevel, wallHeight - bevel * 2)
  const texture = textureOf(canvas)
  wallCache.set(key, texture)
  return texture
}
