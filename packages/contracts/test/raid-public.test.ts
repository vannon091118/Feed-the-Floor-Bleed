import { describe, expect, it } from 'vitest'
import {
  CellType,
  type CellTypeValue,
  createDungeonGrid,
  type DungeonGrid,
  setCell,
} from '../../sim-core/src'
import {
  MatchResponseSchema,
  PLACEMENT_CELL,
  RaidPublicViewSchema,
  toPublicView,
  UploadRequestSchema,
} from '../src'
import { publicView, raidSnapshot, versions } from './raid-fixtures'

/** Ein Raster mit zwei Platzierungsmarkierungen auf dem direkten Weg. */
function dungeonWithPlacement(): DungeonGrid {
  const grid = createDungeonGrid()
  setCell(grid, { x: 1, y: 0 }, CellType.Placement)
  setCell(grid, { x: 2, y: 0 }, CellType.Placement)
  return grid
}

function snapshotWithPlacement() {
  return { ...raidSnapshot(), dungeon: payloadOf(dungeonWithPlacement()) }
}

/** Raster als Contract-Payload: `Uint8Array` wird zur Zahlenliste. */
function payloadOf(grid: DungeonGrid) {
  return {
    cells: Array.from(grid.cells) as CellTypeValue[],
    spawn: { ...grid.spawn },
    boss: { ...grid.boss },
  }
}

describe('Öffentliche Angreifer-Sicht', () => {
  it('trägt nur das Labyrinth und den Boss', () => {
    const view = toPublicView(raidSnapshot())
    expect(Object.keys(view).sort()).toEqual([
      'contractVersion',
      'dungeon',
      'revealed',
      'simVersion',
    ])
    // Kein Roster, kein Bestand, keine Teamdaten — auch nicht als leeres Feld.
    expect(JSON.stringify(view)).not.toContain('monster')
    expect(JSON.stringify(view)).not.toContain('hero')
    expect(RaidPublicViewSchema.safeParse(view).success).toBe(true)
  })

  it('maskiert Platzierungsmarkierungen zu Boden und lässt Wände stehen', () => {
    const view = toPublicView(snapshotWithPlacement())
    expect(view.dungeon.cells[1]).toBe(0)
    expect(view.dungeon.cells[2]).toBe(0)
    expect(view.dungeon.cells[0]).toBe(3)
    expect(view.dungeon.cells[4095]).toBe(4)
    expect(view.dungeon.cells).not.toContain(PLACEMENT_CELL)

    const walled = createDungeonGrid()
    setCell(walled, { x: 5, y: 5 }, CellType.Wall)
    const wallView = toPublicView({
      ...raidSnapshot(),
      dungeon: payloadOf(walled),
    })
    expect(wallView.dungeon.cells[5 * 64 + 5]).toBe(1)
  })

  it('verrät den Roster nicht über die Match-Antwort', () => {
    // Der Kern der Regel: Ein Rohling mit `monsterSlots` scheitert als
    // `snapshot`. Verbergen am Bildschirm wäre keine Verbergung.
    const match = { ...versions, seed: 42, snapshot: publicView(), floor: 1 }
    expect(MatchResponseSchema.safeParse(match).success).toBe(true)
    expect(
      MatchResponseSchema.safeParse({ ...match, snapshot: raidSnapshot() })
        .success,
    ).toBe(false)
    // Damit bleiben die beiden Richtungen unterscheidbar: Der Verteidiger
    // schickt weiter den vollen Stand, der Angreifer bekommt nur die Fassade.
    expect(
      UploadRequestSchema.safeParse({
        ...raidSnapshot(),
        tactics: [[{ ability: 'hold' }]],
      }).success,
    ).toBe(true)
    expect(RaidPublicViewSchema.safeParse(raidSnapshot()).success).toBe(false)
  })

  it('führt die aufgedeckten Zellen als Teil der Sicht', () => {
    // Die Menge gehört zur Sicht und nicht zur Anzeige: was der Angreifer
    // nicht aufgedeckt hat, sieht er nicht, und der Bildschirm darf die Liste
    // nicht raten müssen.
    expect(toPublicView(raidSnapshot()).revealed).toEqual([])
    expect(toPublicView(raidSnapshot(), [1, 2]).revealed).toEqual([1, 2])
    const view = { ...toPublicView(raidSnapshot()), revealed: [4096] }
    expect(RaidPublicViewSchema.safeParse(view).success).toBe(false)
    expect(
      RaidPublicViewSchema.safeParse({
        ...toPublicView(raidSnapshot()),
        revealed: [1.5],
      }).success,
    ).toBe(false)
  })
})
