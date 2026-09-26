import { RaidJobSchema, UploadRequestSchema } from '@floor/contracts'
import { CellType, createDungeonGrid, setCell } from '@floor/sim-core'
import { describe, expect, it } from 'vitest'
import { paintTile } from '../src/dungeon-editor/model'
import {
  buildFixtureUpload,
  runLocalFixtureRaid,
} from '../src/raid/fixture-raid'

/** Zwei versetzte Barrieren zwingen die Route deutlich über die Minimalzahl. */
function snakeGrid() {
  const grid = createDungeonGrid()
  for (let x = 0; x < 63; x += 1) setCell(grid, { x, y: 20 }, CellType.Wall)
  for (let x = 1; x < 64; x += 1) setCell(grid, { x, y: 40 }, CellType.Wall)
  return grid
}

describe('Fixture-Raid aus dem Client', () => {
  it('baut einen gültigen Contract-v2-Upload aus Grid und Fixture', () => {
    const upload = buildFixtureUpload(createDungeonGrid())
    expect(UploadRequestSchema.safeParse(upload).success).toBe(true)
    expect(upload.dungeon.cells).toHaveLength(4096)
    expect(upload.tactics).toHaveLength(upload.activeTeam.length)
    expect(upload.monsterSlots).toHaveLength(5)
  })

  it('liefert lokal einen abgeschlossenen Auftrag mit reproduzierbarem Hash', () => {
    const first = runLocalFixtureRaid(createDungeonGrid())
    const second = runLocalFixtureRaid(createDungeonGrid())
    expect(RaidJobSchema.safeParse(first).success).toBe(true)
    expect(first.status).toBe('completed')
    if (first.status !== 'completed' || second.status !== 'completed') return
    expect(second.result.hash).toBe(first.result.hash)
    expect(first.result.summary.hash).toBe(first.result.hash)
  })

  it('ändert den Hash, wenn die Route länger wird', () => {
    const open = runLocalFixtureRaid(createDungeonGrid())
    const snake = snakeGrid()
    const long = runLocalFixtureRaid(snake)
    if (open.status !== 'completed' || long.status !== 'completed') return
    expect(long.result.hash).not.toBe(open.result.hash)
  })

  it('unterscheidet zwei gleich lange Routen mit anderem Trail', () => {
    const plain = runLocalFixtureRaid(createDungeonGrid())
    const detour = runLocalFixtureRaid(
      paintTile(createDungeonGrid(), 'wall', 1, 0),
    )
    if (plain.status !== 'completed' || detour.status !== 'completed') return
    expect(detour.result.hash).not.toBe(plain.result.hash)
    expect(detour.result.summary.hash).toBe(detour.result.hash)
  })

  it('meldet eine zugemauerte Route als blockierten Auftrag', () => {
    const grid = createDungeonGrid()
    grid.cells[63 * 64 + 62] = CellType.Wall
    grid.cells[62 * 64 + 63] = CellType.Wall
    const job = runLocalFixtureRaid(grid)
    expect(job.status).toBe('failed')
    if (job.status !== 'failed') return
    expect(job.error.code).toBe('blocked')
  })
})
