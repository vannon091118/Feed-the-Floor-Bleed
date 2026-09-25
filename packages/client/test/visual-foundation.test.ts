import {
  CellType,
  createDungeonGrid,
  findPath,
  resolveSnapshotRaid,
} from '@floor/sim-core'
import { describe, expect, it } from 'vitest'
import { paintTile } from '../src/dungeon-editor/model'
import {
  createCamera,
  screenToWorld,
  worldToScreen,
} from '../src/render/camera'
import { depthValue } from '../src/render/depth'
import { createVisualObserver } from '../src/visual'
import { routeActors } from '../src/visual/combat-frame'
import {
  TILES,
  WORLD_CELL_PX,
  cellFoot,
  cellSeed,
  cellToWorld,
  materialById,
  pickVariant,
  tileFor,
  worldToCell,
} from '../src/world'

describe('Weltdefinitionen', () => {
  it('mappt CellType auf Höhe, Occlusion und Material', () => {
    const wall = tileFor(CellType.Wall)
    expect(wall.occludes).toBe(true)
    expect(wall.height).toBeGreaterThan(0)
    expect(wall.walkable).toBe(false)
    expect(tileFor(CellType.Empty).walkable).toBe(true)
    expect(TILES[CellType.Boss].marker).toBe('boss')
  })

  it('wählt dieselbe Materialvariante deterministisch', () => {
    const stone = materialById('stone')
    expect(pickVariant(stone, 42)).toBe(pickVariant(stone, 42))
    expect(pickVariant(stone, 42)).toBeLessThan(stone.variants)
    expect(cellSeed({ x: 3, y: 4 })).toBe(4 * 64 + 3)
  })
})

describe('Weltgeometrie', () => {
  it('rechnet Logikzellen in Weltpixel', () => {
    expect(cellToWorld({ x: 2, y: 3 })).toEqual({
      x: 2 * WORLD_CELL_PX,
      y: 3 * WORLD_CELL_PX,
    })
    expect(cellFoot({ x: 0, y: 0 })).toEqual({
      x: WORLD_CELL_PX / 2,
      y: WORLD_CELL_PX,
    })
  })

  it('klemmt Weltkoordinaten auf das Raster', () => {
    expect(worldToCell({ x: WORLD_CELL_PX * 2 + 1, y: 0 })).toEqual({
      x: 2,
      y: 0,
    })
    expect(worldToCell({ x: -40, y: 10_000 })).toEqual({ x: 0, y: 63 })
  })
})

describe('Kamera', () => {
  it('ist zwischen Welt und Screen verlustfrei umkehrbar', () => {
    const camera = { ...createCamera(800, 600), zoom: 2 }
    const world = { x: 123, y: 87 }
    const back = screenToWorld(camera, worldToScreen(camera, world))
    expect(back.x).toBeCloseTo(world.x, 6)
    expect(back.y).toBeCloseTo(world.y, 6)
  })
})

describe('Depth-Ordnung', () => {
  it('sortiert nach Fußpunkt und lässt Wände Actoren verdecken', () => {
    expect(depthValue(96, 0)).toBeGreaterThan(depthValue(88, 0))
    const actorBehind = depthValue(88, 14)
    const wallInFront = depthValue(96, 22)
    expect(wallInFront).toBeGreaterThan(actorBehind)
  })
})

describe('Visual Observer', () => {
  const grid = createDungeonGrid()
  const route = findPath(grid)

  it('liest Terrain vollständig und meldet danach nichts Neues', () => {
    const observer = createVisualObserver()
    const first = observer.observe({
      grid,
      route,
      combat: null,
      playbackTick: 0,
    })
    expect(first.terrain?.reset).toBe(true)
    expect(first.terrain?.changed).toHaveLength(4096)
    const second = observer.observe({
      grid,
      route,
      combat: null,
      playbackTick: 0,
    })
    expect(second.terrain).toBeNull()
  })

  it('meldet beim Malen nur die betroffenen Zellen', () => {
    const observer = createVisualObserver()
    observer.observe({ grid, route, combat: null, playbackTick: 0 })
    const painted = paintTile(grid, 'wall', 3, 0)
    const delta = observer.observe({
      grid: painted,
      route,
      combat: null,
      playbackTick: 0,
    })
    expect(delta.terrain?.reset).toBe(false)
    expect(delta.terrain?.changed).toHaveLength(16)
  })

  it('bildet Combat-routeIndex auf die echte Route ab', () => {
    const raid = resolveSnapshotRaid({
      grid,
      teamSize: 3,
      monsterSlots: 2,
      seed: 4242,
      floor: 1,
      token: 'fixture',
    })
    const observer = createVisualObserver()
    const delta = observer.observe({
      grid,
      route,
      combat: raid.log.log,
      playbackTick: 0,
    })
    expect(delta.actors).toHaveLength(raid.log.log.units.length)
    const routeCells = new Set(
      route.path.map((point) => `${point.x},${point.y}`),
    )
    for (const actor of delta.actors) {
      expect(routeCells.has(`${actor.cell.x},${actor.cell.y}`)).toBe(true)
    }
  })

  it('setzt im Editor-Leerlauf Helden und Boss auf die Route', () => {
    const actors = routeActors(route.path)
    expect(actors.length).toBeGreaterThan(0)
    expect(actors.some((actor) => actor.kind === 'boss')).toBe(true)
  })
})
