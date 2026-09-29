import { createRng, nextBelow, type RngState } from '@floor/sim-core'
import type { Texture } from 'pixi.js'
import { type MaterialDef, materialById, WORLD_CELL_PX } from '../world'
import { drawingContext, hex, textureOf } from './canvas'

/**
 * Der Fallback-Atlas zeichnet in Zellauflösung, nicht darüber hinaus.
 *
 * Eine Textur, die größer ist als ihre Kachel, wird vom Renderer verkleinert —
 * und ein Nearest-Downscale ist kein Detailgewinn, sondern zufälliges Aliasing.
 * Deshalb sind `TEXTURE_PX` und `WORLD_CELL_PX` dieselbe Zahl, jede Kante fällt
 * auf ganze Pixel, und es gibt keine Verläufe: über eine 32-Pixel-Kachel
 * verteilt sich ein Verlauf auf Nachbarwerte und liest sich als Schmutz.
 */
const TEXTURE_PX = WORLD_CELL_PX
const tileCache = new Map<string, Texture>()
const wallCache = new Map<string, Texture>()

/** Streut auf dem Kachelraster, damit Pixel auf ganzen Koordinaten sitzen. */
function speckle(
  ctx: CanvasRenderingContext2D,
  rng: RngState,
  color: number,
  count: number,
): void {
  ctx.fillStyle = hex(color)
  for (let index = 0; index < count; index += 1) {
    const x = nextBelow(rng, TEXTURE_PX)
    const y = nextBelow(rng, TEXTURE_PX)
    ctx.fillRect(x, y, 1 + nextBelow(rng, 2), 1)
  }
}

/**
 * Eine deterministische Bodenkachel pro Materialvariante.
 *
 * Aufbau: Grundfläche, ein dunkler Rand als Fuge zum Nachbarn, darüber ein
 * hellerer Kern. Die Fuge ist der Grund, warum das Raster lesbar bleibt —
 * ohne sie verschmelzen benachbarte Kacheln zu einer einzigen Fläche.
 */
function drawTile(material: MaterialDef, variant: number): Texture {
  const { canvas, ctx } = drawingContext(TEXTURE_PX)
  ctx.imageSmoothingEnabled = false
  const rng = createRng((material.seedSalt * 131 + variant * 17 + 7) >>> 0)

  ctx.fillStyle = hex(material.edge)
  ctx.fillRect(0, 0, TEXTURE_PX, TEXTURE_PX)
  ctx.fillStyle = hex(material.base)
  ctx.fillRect(1, 1, TEXTURE_PX - 2, TEXTURE_PX - 2)
  // Licht von oben: ein helles Band an der Oberkante, ein dunkles am Fuß.
  ctx.fillStyle = hex(material.detail)
  ctx.fillRect(1, 1, TEXTURE_PX - 2, 2)
  ctx.fillStyle = hex(material.edge)
  ctx.fillRect(1, TEXTURE_PX - 3, TEXTURE_PX - 2, 2)

  speckle(ctx, rng, material.detail, 10 + nextBelow(rng, 8))
  speckle(ctx, rng, material.edge, 6 + nextBelow(rng, 6))

  const texture = textureOf(canvas)
  texture.source.scaleMode = 'nearest'
  return texture
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

/**
 * Frontfläche und beleuchtete Deckplatte für eine einzelne Fake-3D-Mauer.
 *
 * Die Höhe kommt aus `world/tiles.ts` und ist ein Präsentationswert. Die
 * Textur misst `WORLD_CELL_PX` zuzüglich dieser Höhe, damit der Fußpunkt am
 * unteren Bildrand bleibt und die Mauer auf der Zelle steht, nicht darüber.
 */
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
  const wallHeight = WORLD_CELL_PX + height
  const { canvas, ctx } = drawingContext(width, wallHeight)
  ctx.imageSmoothingEnabled = false
  const rng = createRng((material.seedSalt * 193 + variant * 29 + height) >>> 0)

  // Dunkle Fuge ringsum, damit benachbarte Wände nicht zu einer Fläche werden.
  ctx.fillStyle = hex(material.edge)
  ctx.fillRect(0, 0, width, wallHeight)
  ctx.fillStyle = hex(material.base)
  ctx.fillRect(1, 0, width - 2, wallHeight)

  // Deckplatte: die sichtbare Oberseite der Mauer, heller besonnt.
  const cap = Math.max(4, Math.round(width * 0.18))
  ctx.fillStyle = hex(material.detail)
  ctx.fillRect(1, 0, width - 2, cap)
  ctx.fillStyle = hex(material.base)
  ctx.fillRect(1, cap, width - 2, 1)

  // Blockfugen über die Frontfläche, in ganzen Pixelabständen gesetzt.
  ctx.fillStyle = hex(material.edge)
  for (let row = cap + 6; row < wallHeight - 2; row += 7) {
    ctx.fillRect(1, row, width - 2, 1)
    const offset = 1 + nextBelow(rng, width - 8)
    ctx.fillRect(offset, row, 1, 3)
  }
  speckle(ctx, rng, material.detail, 8 + nextBelow(rng, 8))

  // Schatten am Fuß, der die Mauer auf der Zelle absetzt statt sie schweben zu lassen.
  ctx.fillStyle = hex(material.edge)
  ctx.fillRect(1, wallHeight - 2, width - 2, 2)

  const texture = textureOf(canvas)
  texture.source.scaleMode = 'nearest'
  wallCache.set(key, texture)
  return texture
}
