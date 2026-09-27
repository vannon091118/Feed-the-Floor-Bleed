import { Texture } from 'pixi.js'
import { describe, expect, it } from 'vitest'
import {
  clampCamera,
  createCamera,
  panCamera,
  worldToScreen,
} from '../src/render/camera'
import {
  VILLAGE_BUILDINGS,
  VILLAGE_WORLD_WIDTH,
} from '../src/render/village-layout'
import { createVillageScene } from '../src/render/village-scene'

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

describe('Lebendige Dorfpräsentation', () => {
  it('bietet dieselben Building-IDs als klickbare Szenenorte an', () => {
    const clicked: string[] = []
    const scene = createVillageScene(textures, (id) => clicked.push(id))
    const buildings = scene.container.children.filter(
      (child) => child.eventMode === 'static',
    )

    expect(buildings).toHaveLength(VILLAGE_BUILDINGS.length)
    for (const building of buildings) {
      building.emit('pointertap')
    }
    expect(clicked).toEqual(VILLAGE_BUILDINGS.map(({ id }) => id))
    scene.container.destroy({ children: true })
  })

  it('bewegt Bewohner reproduzierbar und hängt nur von der Renderzeit ab', () => {
    const first = createVillageScene(textures)
    const second = createVillageScene(textures)
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
