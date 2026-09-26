import type { Texture } from 'pixi.js'
import type { ActorKind } from '../world'
import { drawingContext, hex, textureOf } from './canvas'

const SIZE = 64
const cache = new Map<ActorKind, Texture>()
type UnitPalette = { body: number; head: number; trim: number }

const colors: Record<ActorKind, UnitPalette> = {
  hero: { body: 0x378f83, head: 0xf1c27d, trim: 0xf3c969 },
  monster: { body: 0x8056a8, head: 0x68417d, trim: 0xb4e16b },
  boss: { body: 0xa3453e, head: 0x7f302d, trim: 0xf0bd64 },
}

function draw(kind: ActorKind): Texture {
  const { canvas, ctx } = drawingContext(SIZE)
  const palette = colors[kind]
  const scale = kind === 'boss' ? 1.15 : 1
  const x = SIZE / 2
  const foot = SIZE * 0.9
  const width = SIZE * 0.42 * scale
  const height = SIZE * 0.48 * scale
  ctx.fillStyle = '#251d27'
  ctx.beginPath()
  ctx.ellipse(
    x,
    foot - height * 0.48,
    width * 0.55,
    height * 0.57,
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()
  ctx.fillStyle = hex(palette.body)
  ctx.beginPath()
  ctx.ellipse(
    x,
    foot - height * 0.48,
    width * 0.48,
    height * 0.5,
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()
  ctx.fillStyle = hex(palette.trim)
  ctx.beginPath()
  if (kind === 'hero') {
    ctx.moveTo(x - width * 0.2, foot - height * 0.75)
    ctx.lineTo(x - width * 0.58, foot - height * 0.12)
    ctx.lineTo(x - width * 0.1, foot - height * 0.2)
    ctx.arc(x, foot - height, width * 0.31, Math.PI, 0)
    ctx.lineTo(x + width * 0.31, foot - height * 0.8)
  } else {
    const horn = kind === 'boss' ? 1.42 : 1.28
    ctx.moveTo(x - width * 0.2, foot - height * 0.9)
    ctx.lineTo(x - width * 0.4, foot - height * horn)
    ctx.lineTo(x - width * 0.02, foot - height * 0.96)
    ctx.moveTo(x + width * 0.2, foot - height * 0.9)
    ctx.lineTo(x + width * 0.4, foot - height * horn)
    ctx.lineTo(x + width * 0.02, foot - height * 0.96)
  }
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = hex(palette.head)
  ctx.beginPath()
  ctx.ellipse(
    x,
    foot - height * 1.02,
    width * 0.36,
    height * 0.23,
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.ellipse(
    x - width * 0.13,
    foot - height,
    width * 0.1,
    height * 0.12,
    0,
    0,
    Math.PI * 2,
  )
  ctx.ellipse(
    x + width * 0.13,
    foot - height,
    width * 0.1,
    height * 0.12,
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()
  ctx.fillStyle = '#241b21'
  ctx.beginPath()
  ctx.arc(x - width * 0.11, foot - height, width * 0.045, 0, Math.PI * 2)
  ctx.arc(x + width * 0.15, foot - height, width * 0.045, 0, Math.PI * 2)
  ctx.fill()
  return textureOf(canvas)
}

export function unitTexture(kind: ActorKind): Texture {
  const cached = cache.get(kind)
  if (cached) return cached
  const texture = draw(kind)
  cache.set(kind, texture)
  return texture
}
