import type { Texture } from 'pixi.js'
import { drawingContext, textureOf } from './canvas'

const routeCache = new Map<string, Texture>()

/** Gepulster Lichtpunkt für die aus der echten Route abgeleiteten Marker. */
export function routeTexture(tone: 'gold' | 'blue'): Texture {
  const cached = routeCache.get(tone)
  if (cached) return cached
  const { canvas, ctx } = drawingContext(64)
  const color = tone === 'gold' ? '#ffd978' : '#9ce7ff'
  const glow = ctx.createRadialGradient(32, 32, 2, 32, 32, 29)
  glow.addColorStop(0, `${color}cc`)
  glow.addColorStop(0.38, `${color}55`)
  glow.addColorStop(1, `${color}00`)
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 64, 64)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(32, 32, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff6cf'
  ctx.beginPath()
  ctx.arc(30, 29, 1.8, 0, Math.PI * 2)
  ctx.fill()
  const texture = textureOf(canvas)
  routeCache.set(tone, texture)
  return texture
}
