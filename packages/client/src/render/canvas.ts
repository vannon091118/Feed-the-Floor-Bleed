import { CanvasSource, Texture } from 'pixi.js'

export interface DrawingContext {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}

export function drawingContext(width: number, height = width): DrawingContext {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas-2D-Kontext nicht verfügbar')
  return { canvas, ctx }
}

export function textureOf(canvas: HTMLCanvasElement): Texture {
  return new Texture({ source: new CanvasSource({ resource: canvas }) })
}

export function hex(color: number): string {
  return `#${(color >>> 0).toString(16).padStart(6, '0')}`
}
