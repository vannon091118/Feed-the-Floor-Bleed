import type { Texture } from 'pixi.js'
import { drawingContext, textureOf } from './canvas'

let glow: Texture | null = null

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

/** Warmer Lichtabfall an den Bildrändern; liegt in der Screen-Ebene. */
export function vignetteTexture(): Texture {
  if (vignette) return vignette
  const { canvas, ctx } = drawingContext(256)
  const gradient = ctx.createRadialGradient(128, 128, 34, 128, 128, 128)
  gradient.addColorStop(0, 'rgba(5,8,14,0.04)')
  gradient.addColorStop(0.62, 'rgba(5,8,14,0.12)')
  gradient.addColorStop(0.84, 'rgba(5,8,14,0.36)')
  gradient.addColorStop(1, 'rgba(5,8,14,0.72)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  vignette = textureOf(canvas)
  return vignette
}
