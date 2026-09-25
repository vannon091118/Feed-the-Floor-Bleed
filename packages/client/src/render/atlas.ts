import { createRng, nextBelow } from '@floor/sim-core'
import { CanvasSource, Texture } from 'pixi.js'
import {
  type ActorKind,
  type MaterialDef,
  WORLD_TILE_PX,
  materialById,
} from '../world'

const TEXTURE_PX = WORLD_TILE_PX * 2

function hex(color: number): string {
  return `#${(color >>> 0).toString(16).padStart(6, '0')}`
}

interface DrawingContext {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}

function drawingContext(size: number): DrawingContext {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas-2D-Kontext nicht verfügbar')
  return { canvas, ctx }
}

function textureOf(canvas: HTMLCanvasElement): Texture {
  return new Texture({ source: new CanvasSource({ resource: canvas }) })
}

const tileCache = new Map<string, Texture>()

function drawTile(material: MaterialDef, variant: number): Texture {
  const { canvas, ctx } = drawingContext(TEXTURE_PX)
  const rng = createRng((material.seedSalt * 131 + variant * 17 + 7) >>> 0)
  ctx.fillStyle = hex(material.base)
  ctx.fillRect(0, 0, TEXTURE_PX, TEXTURE_PX)
  ctx.strokeStyle = hex(material.edge)
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, TEXTURE_PX - 4, TEXTURE_PX - 4)
  ctx.fillStyle = hex(material.detail)
  const dots = 12 + nextBelow(rng, 10)
  for (let index = 0; index < dots; index += 1) {
    const x = nextBelow(rng, TEXTURE_PX)
    const y = nextBelow(rng, TEXTURE_PX)
    ctx.globalAlpha = 0.18 + nextBelow(rng, 30) / 100
    ctx.fillRect(x, y, 2 + nextBelow(rng, 4), 2 + nextBelow(rng, 2))
  }
  ctx.globalAlpha = 1
  return textureOf(canvas)
}

/** Eine Textur je Material und Variante. Deterministisch, nicht zufällig. */
export function tileTexture(materialId: string, variant: number): Texture {
  const material = materialById(materialId)
  const key = `${materialId}#${variant % material.variants}`
  const cached = tileCache.get(key)
  if (cached) return cached
  const texture = drawTile(material, variant % material.variants)
  tileCache.set(key, texture)
  return texture
}

const unitCache = new Map<ActorKind, Texture>()

const UNIT_COLORS: Record<ActorKind, { body: number; head: number }> = {
  hero: { body: 0x3b82f6, head: 0xf1c27d },
  monster: { body: 0x8b5cf6, head: 0x4c1d95 },
  boss: { body: 0xb91c1c, head: 0x7f1d1d },
}

function drawUnit(kind: ActorKind): Texture {
  const { canvas, ctx } = drawingContext(TEXTURE_PX)
  const colors = UNIT_COLORS[kind]
  const scale = kind === 'boss' ? 1.15 : 1
  const cx = TEXTURE_PX / 2
  const baseY = TEXTURE_PX * 0.9
  const bodyWidth = TEXTURE_PX * 0.42 * scale
  const bodyHeight = TEXTURE_PX * 0.48 * scale
  ctx.strokeStyle = hex(0x0b0e14)
  ctx.lineWidth = 3
  ctx.fillStyle = hex(colors.body)
  ctx.beginPath()
  ctx.roundRect(
    cx - bodyWidth / 2,
    baseY - bodyHeight,
    bodyWidth,
    bodyHeight,
    TEXTURE_PX * 0.16,
  )
  ctx.fill()
  ctx.stroke()
  const headRadius = TEXTURE_PX * 0.14 * scale
  ctx.fillStyle = hex(colors.head)
  ctx.beginPath()
  ctx.arc(cx, baseY - bodyHeight - headRadius * 0.5, headRadius, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  return textureOf(canvas)
}

export function unitTexture(kind: ActorKind): Texture {
  const cached = unitCache.get(kind)
  if (cached) return cached
  const texture = drawUnit(kind)
  unitCache.set(kind, texture)
  return texture
}

let glow: Texture | null = null

/** Weicher weißer Kreis; per `tint` für Schatten, Funken und Licht wiederverwendet. */
export function glowTexture(): Texture {
  if (glow) return glow
  const { canvas, ctx } = drawingContext(64)
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.35)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  glow = textureOf(canvas)
  return glow
}

let vignette: Texture | null = null

/** Dunkle Ränder für eine billige Lichtwirkung; liegt in der Screen-Ebene. */
export function vignetteTexture(): Texture {
  if (vignette) return vignette
  const { canvas, ctx } = drawingContext(256)
  const gradient = ctx.createRadialGradient(128, 128, 40, 128, 128, 128)
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(0.7, 'rgba(0,0,0,0.18)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  vignette = textureOf(canvas)
  return vignette
}
