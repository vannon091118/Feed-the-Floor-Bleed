import { CellType, createDungeonGrid, findPath, getCell } from '@floor/sim-core'
import { describe, expect, it } from 'vitest'
import {
  paintTile,
  startDungeon,
  tileMarker,
} from '../src/dungeon-editor/model'
import {
  grid,
  paintVisibleTile,
  resetGrid,
  route,
} from '../src/dungeon-editor/state'
import { fixture } from '../src/fixture-data'

describe('Dungeon-Editor', () => {
  it('startet mit gültigem Spielstand und einer erreichbaren Route', () => {
    resetGrid()
    expect(fixture.team).toHaveLength(3)
    expect(route.value.mode).toBe('reachable')
    expect(route.value.movementCost).toBe(126)
  })

  it('setzt ein sichtbares Tile in den 4x4-Logikbereich um', () => {
    resetGrid()
    paintVisibleTile(3, 0)
    expect(getCell(grid.value, { x: 12, y: 0 })).toBe(CellType.Wall)
    expect(getCell(grid.value, { x: 15, y: 3 })).toBe(CellType.Wall)
  })

  it('stellt beim Reset den Startdungeon wieder her', () => {
    resetGrid()
    paintVisibleTile(3, 0)
    resetGrid()
    expect(getCell(grid.value, { x: 12, y: 0 })).toBe(CellType.Empty)
    // Der Startdungeon trägt zwei Platzierungsgruppen; der Reset muss sie
    // zurückbringen, sonst fiele die Zonen-Regel nach dem ersten Übermalen aus.
    expect(getCell(grid.value, { x: 30, y: 0 })).toBe(CellType.Placement)
  })

  it('legt die Platzierungsgruppen auf den Korridor, damit der Lauf Zonen hat', () => {
    const start = startDungeon()
    const placements = [
      { x: 30, y: 0 },
      { x: 31, y: 0 },
      { x: 50, y: 0 },
      { x: 51, y: 0 },
    ]
    for (const point of placements) {
      expect(getCell(start, point)).toBe(CellType.Placement)
    }
    // Der Startdungeon ist der neutrale Dungeon plus Markierungen: Spawn und
    // Boss bleiben, wo sie waren, und die Markierung blockiert nichts.
    expect(getCell(start, { x: 0, y: 0 })).toBe(CellType.Spawn)
    expect(getCell(start, { x: 63, y: 63 })).toBe(CellType.Boss)
    expect(findPath(start).movementCost).toBe(
      findPath(createDungeonGrid()).movementCost,
    )
  })

  it('lässt Spawn und Boss beim Malen unangetastet', () => {
    resetGrid()
    paintVisibleTile(0, 0)
    paintVisibleTile(15, 15)
    expect(getCell(grid.value, { x: 0, y: 0 })).toBe(CellType.Spawn)
    expect(getCell(grid.value, { x: 63, y: 63 })).toBe(CellType.Boss)
    expect(getCell(grid.value, { x: 1, y: 0 })).toBe(CellType.Wall)
    expect(getCell(grid.value, { x: 62, y: 63 })).toBe(CellType.Wall)
  })

  it('findet Spawn und Boss im richtigen sichtbaren Tile', () => {
    resetGrid()
    expect(tileMarker(grid.value, 0, 0)).toBe('start')
    expect(tileMarker(grid.value, 15, 15)).toBe('boss')
    expect(tileMarker(grid.value, 7, 7)).toBeNull()
  })

  it('malt im Modell ohne das Eingangsgrid zu verändern', () => {
    const source = createDungeonGrid()
    const result = paintTile(source, 'wall', 1, 1)
    expect(result).not.toBe(source)
    expect(getCell(source, { x: 4, y: 4 })).toBe(CellType.Empty)
    expect(getCell(result, { x: 4, y: 4 })).toBe(CellType.Wall)
  })
})
