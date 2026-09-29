import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CellType } from '@floor/sim-core'
import { describe, expect, it } from 'vitest'
import { materialById, TILES, WORLD_CELL_PX } from '../src/world'

const CLIENT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ASSETS = join(CLIENT_ROOT, 'public', 'assets')

/**
 * Liest die IHDR-Abmessungen (Breite, Höhe) einer committed PNG.
 *
 * Byte 16..20 = Breite, 20..24 = Höhe, big-endian — dasselbe, das
 * `asset-generator.test.ts` für die Strukturprüfung nutzt. Wichtig: hier wird
 * die *committed* Datei gelesen, der Generator läuft nicht. Ein frischer Lauf
 * würde die Drift heilen und jede Staleness verborgen lassen.
 */
function committedDims(name: string): { width: number; height: number } {
  const bytes = readFileSync(join(ASSETS, name))
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

/**
 * Pinnt die committed Blätter an ihre Quelle.
 *
 * `asset-generator.test.ts` schreibt frische Dateien nach `public/assets/` und
 * vergleicht Lauf gegen Lauf — die Drift zwischen einer committed Datei und
 * einer geänderten Quelle fängt er darum nicht. Dieser Test liest stattdessen
 * die committed Bytes und prüft sie gegen `materials.ts` (Variante) und
 * `tiles.ts` (Wandhöhe). Ändert dort jemand eine Zahl, muss das Blatt neu
 * erzeugt und committet werden — sonst schlägt genau dieser Test rot, statt
 * die Wand im Dungeon still prozedural fallen zu lassen.
 */
describe('committed Blätter', () => {
  for (const material of ['arcane', 'moss', 'soil', 'stone', 'wood'] as const) {
    it(`Boden ${material} trägt die Variantenzahl von materials.ts`, () => {
      const { width, height } = committedDims(`dungeon_floor_${material}.png`)
      expect(height).toBe(WORLD_CELL_PX)
      expect(width).toBe(WORLD_CELL_PX * materialById(material).variants)
    })
  }

  it('die Steinwand trägt die Höhe aus tiles.ts', () => {
    const { width, height } = committedDims('dungeon_wall_stone.png')
    expect(height).toBe(WORLD_CELL_PX + TILES[CellType.Wall].height)
    expect(width).toBe(WORLD_CELL_PX * materialById('stone').variants)
  })
})
