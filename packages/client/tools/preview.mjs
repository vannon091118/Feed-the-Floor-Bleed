/**
 * Vorschau der erzeugten Blätter, hochskaliert zum Ansehen.
 *
 * Kein Teil des Generators und kein Test: Die Blätter sind 32 Pixel breit und
 * lassen sich in dieser Größe im Bildbetrachter nicht beurteilen. Dieses Skript
 * legt daneben eine vergrößerte Fassung ab, damit die Änderung am Bild
 * gesprochen werden kann statt behauptet.
 *
 * Die Vorschau liegt bewusst **außerhalb** von `public/`: Vite kopiert dieses
 * Verzeichnis ungefiltert in den Build, und sechs Blätter in 6-facher
 * Vergrößerung wären eine Viertelmegabyte Nutzlast, die niemand ausliefert.
 *
 * Aufruf: `node tools/preview.mjs` — Ausgabe nach `tools/_preview/`.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { drawFloor } from './draw.mjs'
import { drawWall } from './draw-wall.mjs'
import { createRng } from './palette.mjs'
import { encodePng } from './png.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(HERE, '_preview')
const ZOOM = 6

/** Setzt einen Frame vergrößert in den Zielpuffer. */
function blit(target, frame, dx, dy) {
  for (let y = 0; y < frame.height * ZOOM; y += 1) {
    for (let x = 0; x < frame.width * ZOOM; x += 1) {
      const source = (((y / ZOOM) | 0) * frame.width + ((x / ZOOM) | 0)) * 4
      const offset = ((dy + y) * target.width + (dx + x)) * 4
      target.data[offset] = frame.data[source]
      target.data[offset + 1] = frame.data[source + 1]
      target.data[offset + 2] = frame.data[source + 2]
      target.data[offset + 3] = 255
    }
  }
}

function sheet(materialId, count, cell, height) {
  const frameWidth = cell
  const target = {
    width: frameWidth * count * ZOOM,
    height: height * ZOOM,
    data: new Uint8Array(frameWidth * count * ZOOM * height * ZOOM * 4),
  }
  for (let variant = 0; variant < count; variant += 1) {
    const frame =
      materialId === 'wall'
        ? drawWall(cell, height - cell, createRng((variant * 40503) >>> 0))
        : drawFloor(materialId, variant, cell)
    blit(target, frame, variant * frameWidth * ZOOM, 0)
  }
  return encodePng(target.width, target.height, target.data)
}

mkdirSync(OUT_DIR, { recursive: true })
const cell = 32
const wallHeight = 54
for (const [name, materialId, count, height] of [
  ['arcane', 'arcane', 5, cell],
  ['moss', 'moss', 5, cell],
  ['soil', 'soil', 6, cell],
  ['stone', 'stone', 8, cell],
  ['wood', 'wood', 4, cell],
  ['wall_stone', 'wall', 8, wallHeight],
]) {
  writeFileSync(
    join(OUT_DIR, `${name}.png`),
    sheet(materialId, count, cell, height),
  )
  console.log(`_preview/${name}.png`)
}
