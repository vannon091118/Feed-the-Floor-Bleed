import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CellType } from '@floor/sim-core'
import { describe, expect, it } from 'vitest'
import { TILES, WORLD_CELL_PX } from '../src/world'

/**
 * Pinned die Zusage, unter der E6 erfüllt ist: Herkunft und Erzeugung der
 * Blätter sind nachvollziehbar, nicht behauptet. Dasselbe Skript muss auf
 * jedem Rechner dieselbe Datei liefern — sonst ist das Blatt im Repo eine
 * Laune des Tages und nicht der Stand eines geprüften Werkzeugs.
 */

const CLIENT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(CLIENT_ROOT, 'public', 'assets')
const GENERATOR = join(CLIENT_ROOT, 'tools', 'generate-assets.mjs')

const SHEETS = [
  ['dungeon_floor_arcane.png', WORLD_CELL_PX],
  ['dungeon_floor_moss.png', WORLD_CELL_PX],
  ['dungeon_floor_soil.png', WORLD_CELL_PX],
  ['dungeon_floor_stone.png', WORLD_CELL_PX],
  ['dungeon_floor_wood.png', WORLD_CELL_PX],
  ['dungeon_wall_stone.png', WORLD_CELL_PX + TILES[CellType.Wall].height],
] as const

function runGenerator(): void {
  execFileSync(process.execPath, [GENERATOR], { cwd: CLIENT_ROOT })
}

describe('Spriteblatt-Generator', () => {
  it('liefert bei zwei Läufen bytegleiche Dateien', () => {
    runGenerator()
    const first = SHEETS.map(([name]) => readFileSync(join(OUT_DIR, name)))
    runGenerator()
    const second = SHEETS.map(([name]) => readFileSync(join(OUT_DIR, name)))
    for (const [index] of SHEETS.entries()) {
      expect(second[index].equals(first[index])).toBe(true)
    }
  })

  it('schreibt PNG-Signatur, IHDR, IEND und kein Fremdformat', () => {
    for (const [name, height] of SHEETS) {
      const bytes = readFileSync(join(OUT_DIR, name))
      // PNG-Signatur
      expect([...bytes.subarray(0, 8)]).toEqual([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ])
      const text = bytes.toString('latin1')
      expect(text).toContain('IHDR')
      expect(text).toContain('IEND')
      // Höhe aus dem IHDR: Bytes 20..24, big endian.
      const pngHeight = bytes.readUInt32BE(20)
      expect(pngHeight).toBe(height)
      // Und die Breite ist ein Vielfaches der Kachelbreite.
      expect(bytes.readUInt32BE(16) % WORLD_CELL_PX).toBe(0)
    }
  })
})
