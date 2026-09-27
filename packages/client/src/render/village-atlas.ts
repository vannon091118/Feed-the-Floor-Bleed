import type { Texture } from 'pixi.js'
import { drawingContext, textureOf } from './canvas'
import type { BuildingKind } from './village-layout'

const groundCache = new Map<number, Texture>()
const buildingCache = new Map<BuildingKind, Texture>()
let tree: Texture | null = null

function ground(variant: number): Texture {
  const key = ((variant % 8) + 8) % 8
  const cached = groundCache.get(key)
  if (cached) return cached
  const { canvas, ctx } = drawingContext(32)
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#66884e'
  ctx.fillRect(0, 0, 32, 32)
  for (let index = 0; index < 9; index += 1) {
    const seed = (key + 1) * 7919 + index * 104729
    const x = (seed >>> 3) % 30
    const y = (seed >>> 9) % 30
    ctx.fillStyle = index % 3 === 0 ? '#78975a' : '#587843'
    ctx.fillRect(x, y, 1 + (seed % 3), 1 + ((seed >>> 5) % 2))
  }
  const texture = textureOf(canvas)
  texture.source.scaleMode = 'nearest'
  groundCache.set(key, texture)
  return texture
}

let resident: Texture | null = null

function residentTexture(): Texture {
  if (resident) return resident
  const { canvas, ctx } = drawingContext(16, 24)
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#302a25'
  ctx.fillRect(5, 2, 6, 6)
  ctx.fillStyle = '#e6bc83'
  ctx.fillRect(6, 3, 4, 4)
  ctx.fillStyle = '#4d7292'
  ctx.fillRect(4, 8, 8, 8)
  ctx.fillStyle = '#332c2a'
  ctx.fillRect(4, 16, 3, 7)
  ctx.fillRect(9, 16, 3, 7)
  ctx.fillStyle = '#d7ae79'
  ctx.fillRect(2, 9, 2, 7)
  ctx.fillRect(12, 9, 2, 7)
  resident = textureOf(canvas)
  resident.source.scaleMode = 'nearest'
  return resident
}

const ROOFS: Record<BuildingKind, string> = {
  hall: '#426b83',
  guild: '#65517c',
  house: '#a65f43',
  workshop: '#557c4f',
}

function building(kind: BuildingKind): Texture {
  const cached = buildingCache.get(kind)
  if (cached) return cached
  const { canvas, ctx } = drawingContext(64, 72)
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = 'rgba(24, 24, 20, 0.36)'
  ctx.fillRect(8, 57, 48, 8)
  ctx.fillStyle = '#473728'
  ctx.fillRect(9, 32, 46, 31)
  ctx.fillStyle = kind === 'hall' ? '#c8a875' : '#b99166'
  ctx.fillRect(13, 31, 38, 27)
  ctx.fillStyle = '#ead39d'
  ctx.fillRect(16, 34, 32, 3)
  ctx.fillStyle = '#745334'
  ctx.fillRect(28, 43, 9, 15)
  ctx.fillStyle = '#f2cf70'
  ctx.fillRect(18, 41, 6, 7)
  ctx.fillRect(41, 41, 6, 7)
  ctx.fillStyle = '#3c2e25'
  ctx.fillRect(20, 43, 2, 3)
  ctx.fillRect(43, 43, 2, 3)
  ctx.fillStyle = '#302b32'
  ctx.beginPath()
  ctx.moveTo(5, 33)
  ctx.lineTo(32, 8)
  ctx.lineTo(59, 33)
  ctx.lineTo(53, 38)
  ctx.lineTo(32, 20)
  ctx.lineTo(11, 38)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = ROOFS[kind]
  ctx.beginPath()
  ctx.moveTo(8, 31)
  ctx.lineTo(32, 10)
  ctx.lineTo(56, 31)
  ctx.lineTo(51, 34)
  ctx.lineTo(32, 18)
  ctx.lineTo(13, 34)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#91a2a0'
  ctx.fillRect(30, 4, 5, 12)
  ctx.fillStyle = '#d1c5a5'
  ctx.fillRect(28, 3, 9, 3)
  ctx.fillStyle = 'rgba(255, 235, 174, 0.75)'
  ctx.fillRect(19, 42, 2, 2)
  ctx.fillRect(42, 42, 2, 2)
  const texture = textureOf(canvas)
  texture.source.scaleMode = 'nearest'
  buildingCache.set(kind, texture)
  return texture
}

function treeTexture(): Texture {
  if (tree) return tree
  const { canvas, ctx } = drawingContext(32, 48)
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = 'rgba(20, 25, 18, 0.35)'
  ctx.fillRect(4, 38, 25, 6)
  ctx.fillStyle = '#65472e'
  ctx.fillRect(13, 27, 7, 16)
  ctx.fillStyle = '#31553a'
  ctx.fillRect(5, 16, 22, 16)
  ctx.fillRect(9, 9, 15, 17)
  ctx.fillRect(13, 4, 7, 11)
  ctx.fillStyle = '#739653'
  ctx.fillRect(9, 15, 5, 4)
  ctx.fillRect(17, 9, 4, 5)
  tree = textureOf(canvas)
  tree.source.scaleMode = 'nearest'
  return tree
}

export const villageTexture = {
  ground,
  building,
  tree: treeTexture,
  resident: residentTexture,
}
