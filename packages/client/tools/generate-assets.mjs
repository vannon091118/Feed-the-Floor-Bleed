import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { drawFloor } from './draw.mjs'
import { drawWall } from './draw-wall.mjs'
import { createRng } from './palette.mjs'
import { encodePng } from './png.mjs'

/**
 * Erzeugt die Dungeon-Spritesheets.
 *
 * Aufruf: `pnpm --filter @floor/client assets`. Die Ausgabe ist deterministisch
 * — derselbe Aufruf liefert bytegleiche Dateien, was der Test
 * `test/asset-generator.test.ts` prüft. Das ist die Bedingung, unter der E6
 * erfüllt ist: Herkunft und Erzeugung sind nachvollziehbar, nicht behauptet.
 *
 * Die Zahlen kommen aus `src/world/materials.ts` und `src/world/tiles.ts`.
 * Sie werden aus der Quelle **gelesen**, nicht hier wiederholt: Eine Palette an
 * zwei Stellen würde still auseinanderlaufen, sobald jemand ein Material
 * umfärbt.
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const CLIENT_ROOT = join(HERE, '..')
const OUT_DIR = join(CLIENT_ROOT, 'public', 'assets')
const SOURCE_ROOT = join(CLIENT_ROOT, 'src')

/** Liest die Materialvarianten, statt sie hier zu setzen. */
function readMaterialVariants() {
  const source = readFileSync(
    join(SOURCE_ROOT, 'world', 'materials.ts'),
    'utf8',
  )
  const variants = new Map()
  // Jede Materialkonstante endet auf `variants: <zahl>`; die ID steht zwei
  // Zeilen darüber als `id: '<name>'`. Der Zeilenabstand ist hier Absicht:
  // eine Ad-hoc-Auswertung, die beim Umformatieren bricht, wäre schlimmer als
  // eine kleine, die am Stück geprüft wird.
  const blocks = source.split(/export const MATERIAL_/).slice(1)
  for (const block of blocks) {
    const id = block.match(/id:\s*'([^']+)'/)?.[1]
    const count = block.match(/variants:\s*(\d+)/)?.[1]
    if (!id || !count) continue
    variants.set(id, Number(count))
  }
  if (variants.size === 0) {
    throw new Error('keine Materialvarianten in materials.ts gefunden')
  }
  return variants
}

/** Liest die künstliche Wandhöhe aus `world/tiles.ts`. */
function readWallHeight() {
  const source = readFileSync(join(SOURCE_ROOT, 'world', 'tiles.ts'), 'utf8')
  const height = source.match(/CellType\.Wall[\s\S]*?height:\s*(\d+)/)?.[1]
  if (!height) throw new Error('keine Wandhöhe in tiles.ts gefunden')
  return Number(height)
}

/** Liest die Kantenlänge der Logikzelle aus `world/geometry.ts`. */
function readCellSize() {
  const source = readFileSync(join(SOURCE_ROOT, 'world', 'geometry.ts'), 'utf8')
  const size = source.match(/WORLD_CELL_PX\s*=\s*(\d+)/)?.[1]
  if (!size) throw new Error('keine Zellgröße in geometry.ts gefunden')
  return Number(size)
}

/** Setzt die Frames eines Blattes nebeneinander in einen Streifen. */
function sheetOf(frames) {
  const frameWidth = frames[0].width
  const height = frames[0].height
  const width = frameWidth * frames.length
  const data = new Uint8Array(width * height * 4)
  frames.forEach((frame, index) => {
    for (let y = 0; y < height; y += 1) {
      const rowStart = y * frame.width * 4
      const target = (y * width + index * frameWidth) * 4
      data.set(frame.data.subarray(rowStart, rowStart + frameWidth * 4), target)
    }
  })
  return { width, height, data }
}

function write(name, sheet) {
  const file = join(OUT_DIR, name)
  writeFileSync(file, encodePng(sheet.width, sheet.height, sheet.data))
  return { name, ...sheet }
}

export function generate() {
  const cell = readCellSize()
  const wallHeight = readWallHeight()
  const variants = readMaterialVariants()
  mkdirSync(OUT_DIR, { recursive: true })

  const written = []
  for (const [materialId, count] of variants) {
    const frames = []
    for (let variant = 0; variant < count; variant += 1) {
      frames.push(drawFloor(materialId, variant, cell))
    }
    written.push(write(`dungeon_floor_${materialId}.png`, sheetOf(frames)))
  }

  // Stein ist die einzige Wand in `world/tiles.ts`; für Soil und Moss eine
  // Wand zu rastern hieße, eine Spielentscheidung zu erfinden.
  const wallFrames = []
  for (let variant = 0; variant < variants.get('stone'); variant += 1) {
    wallFrames.push(
      drawWall(cell, wallHeight, createRng((variant * 40503) >>> 0)),
    )
  }
  written.push(write('dungeon_wall_stone.png', sheetOf(wallFrames)))

  return { cell, wallHeight, variants, written }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = generate()
  for (const entry of result.written) {
    console.log(`${entry.name}  ${entry.width}×${entry.height}`)
  }
  console.log(
    `Zelle ${result.cell} px, Wandhöhe ${result.wallHeight} px, ` +
      `${result.written.length} Blätter`,
  )
}
