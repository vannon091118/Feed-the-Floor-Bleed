import { type FederatedPointerEvent, Texture } from 'pixi.js'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  clampCamera,
  createCamera,
  panCamera,
  worldToScreen,
} from '../src/render/camera'
import {
  projectVillagePlot,
  VILLAGE_WORLD_WIDTH,
} from '../src/render/village-layout'
import {
  createVillageScene,
  type VillageScene,
} from '../src/render/village-scene'
import { villagePlots } from '../src/ui/scene-switch'
import { BALANCE } from '../src/village/balance'
import { buildBuilding } from '../src/village/commands'
import { dayNight, resetDayNight } from '../src/village/state'

beforeEach(() => {
  resetDayNight()
})

const textures = {
  ground: Texture.EMPTY,
  tree: Texture.EMPTY,
  resident: Texture.EMPTY,
  buildings: {
    hall: Texture.EMPTY,
    guild: Texture.EMPTY,
    house: Texture.EMPTY,
    workshop: Texture.EMPTY,
  },
}

/** Die gezeichneten Gebäude der Szene — ohne Klickempfänger sind es Kinder. */
function drawn(scene: VillageScene) {
  return scene.container.children.filter((child) =>
    child.label.startsWith('Gebäude:'),
  )
}

/** Der gezeichnete Standort eines Sprites als vergleichbares Rechteck. */
function spotOf(sprite: {
  x: number
  y: number
  width: number
  height: number
}) {
  return {
    x: sprite.x,
    y: sprite.y,
    width: sprite.width,
    height: sprite.height,
  }
}

describe('Lebendige Dorfpräsentation', () => {
  it('zeichnet ohne Dorfbestand keinen einzigen Ort', () => {
    const scene = createVillageScene(textures, {
      plots: () => ({ grid: { columns: 10, rows: 10 }, buildings: [] }),
    })
    expect(drawn(scene)).toHaveLength(0)
    scene.container.destroy({ children: true })
  })

  it('stellt die festen Startorte an ihre freigegebenen Zellen', () => {
    const scene = createVillageScene(textures, { plots: villagePlots })
    const sites = dayNight.value.village.buildings
    expect(sites.map(({ kind }) => kind)).toEqual(['hall', 'guild'])

    const shown = drawn(scene)
    expect(shown).toHaveLength(sites.length)
    shown.forEach((sprite, index) => {
      expect(spotOf(sprite)).toEqual(
        projectVillagePlot(sites[index].footprint, villagePlots().grid),
      )
    })
    scene.container.destroy({ children: true })
  })

  it('nimmt ein gebautes Haus im nächsten Takt an seine Plot-Zelle auf', () => {
    const scene = createVillageScene(textures, { plots: villagePlots })
    const built = buildBuilding('house', { x: 0, y: 0 }, BALANCE)
    expect(built.ok).toBe(true)
    // Bis zum nächsten Takt steht das Bild noch auf dem alten Stand.
    expect(drawn(scene)).toHaveLength(2)

    scene.update(0)
    const shown = drawn(scene)
    expect(shown).toHaveLength(3)
    expect(spotOf(shown[2])).toEqual(
      projectVillagePlot(
        { x: 0, y: 0, width: 2, height: 2 },
        villagePlots().grid,
      ),
    )
    scene.container.destroy({ children: true })
  })

  it('meldet beim Klick den Listenplatz des Gebäudes', () => {
    buildBuilding('workshop', { x: 0, y: 0 }, BALANCE)
    const clicked: number[] = []
    const scene = createVillageScene(textures, {
      plots: villagePlots,
      onBuildingClick: (index) => clicked.push(index),
    })

    const shown = drawn(scene)
    expect(shown.every((sprite) => sprite.eventMode === 'static')).toBe(true)
    for (const sprite of shown) {
      // Pixi verlangt für `pointertap` ein Ereignisobjekt; die Szene liest es nicht.
      sprite.emit('pointertap', {} as FederatedPointerEvent)
    }
    expect(clicked).toEqual([0, 1, 2])
    scene.container.destroy({ children: true })
  })

  it('bewegt Bewohner reproduzierbar und hängt nur von der Renderzeit ab', () => {
    const first = createVillageScene(textures, { plots: villagePlots })
    const second = createVillageScene(textures, { plots: villagePlots })
    first.update(4_000)
    second.update(4_000)
    const firstX = first.container.children.slice(-4).map((sprite) => sprite.x)
    const secondX = second.container.children
      .slice(-4)
      .map((sprite) => sprite.x)
    expect(firstX).toEqual(secondX)
    expect(new Set(firstX).size).toBeGreaterThan(1)
    first.container.destroy({ children: true })
    second.container.destroy({ children: true })
  })
})

describe('Kamera für Dorf und Dungeon', () => {
  it('klemmt Pan-Bewegung auf die größere Dorfwelt und bleibt invertierbar', () => {
    const camera = createCamera(800, 600)
    const village = clampCamera(
      { ...camera, x: 9999, y: 9999, zoom: 1 },
      'village',
    )
    expect(village.x).toBe(VILLAGE_WORLD_WIDTH - village.viewportWidth / 2)
    expect(village.y).toBeGreaterThan(0)

    const panned = panCamera(village, -50, 0, 'village')
    expect(panned.x).toBeLessThan(village.x)
    expect(worldToScreen(panned, { x: panned.x, y: panned.y })).toEqual({
      x: 400,
      y: 300,
    })
  })
})
