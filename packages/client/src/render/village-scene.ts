import { Container, Sprite, type Texture, TilingSprite } from 'pixi.js'
import { villageTexture } from './village-atlas'
import {
  type BuildingKind,
  VILLAGE_BUILDINGS,
  VILLAGE_TREES,
  VILLAGE_WORLD_HEIGHT,
  VILLAGE_WORLD_WIDTH,
} from './village-layout'

export interface VillageTextures {
  ground?: Texture
  tree?: Texture
  resident?: Texture
  buildings?: Partial<Record<BuildingKind, Texture>>
}

export interface VillageScene {
  container: Container
  update(elapsedMs: number): void
}

export type { BuildingKind } from './village-layout'

/** Wie weit die Wiese über das Weltrechteck hinausreicht. */
const BACKDROP_SPAN = 4

const WALKERS = [
  { from: 120, to: 820, y: 355, offset: 0 },
  { from: 165, to: 870, y: 510, offset: 0.38 },
  { from: 130, to: 745, y: 325, offset: 0.7 },
  { from: 260, to: 910, y: 575, offset: 0.2 },
] as const

function placeSprite(
  parent: Container,
  texture: Texture,
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number,
): Sprite {
  const sprite = new Sprite(texture)
  sprite.anchor.set(0.5, 1)
  sprite.position.set(x, y)
  sprite.width = width
  sprite.height = height
  sprite.zIndex = depth
  parent.addChild(sprite)
  return sprite
}

/** Pixel-Dorf mit anklickbaren Gebäuden und deterministischer Bewohnerbewegung. */
export function createVillageScene(
  textures: VillageTextures = {},
  onBuildingClick?: (id: string) => void,
): VillageScene {
  const container = new Container()
  container.sortableChildren = true

  // Die Wiese hinter dem Weltrechteck: breite Viewports sehen keinen schwarzen Rand.
  const backdrop = new TilingSprite({
    texture: textures.ground ?? villageTexture.ground(0),
    width: VILLAGE_WORLD_WIDTH * BACKDROP_SPAN,
    height: VILLAGE_WORLD_HEIGHT * BACKDROP_SPAN,
    tileScale: { x: 0.5, y: 0.5 },
  })
  backdrop.anchor.set(0.5)
  backdrop.position.set(VILLAGE_WORLD_WIDTH / 2, VILLAGE_WORLD_HEIGHT / 2)
  backdrop.tint = 0x7c9a62
  backdrop.zIndex = -100
  container.addChild(backdrop)

  for (let y = 0; y < VILLAGE_WORLD_HEIGHT; y += 32) {
    for (let x = 0; x < VILLAGE_WORLD_WIDTH; x += 32) {
      const variant = variantAt(x, y)
      const tile = placeSprite(
        container,
        textures.ground ?? villageTexture.ground(variant),
        x + 16,
        y + 32,
        32,
        32,
        y,
      )
      if (variant === 0) tile.tint = 0x9cbe78
    }
  }

  const pathY = 345
  for (let x = 80; x <= 920; x += 32) {
    const path = placeSprite(
      container,
      textures.ground ?? villageTexture.ground(variantAt(x, pathY)),
      x,
      pathY,
      32,
      24,
      pathY + 1,
    )
    path.tint = 0xc9ad77
  }

  for (const tree of VILLAGE_TREES) {
    placeSprite(
      container,
      textures.tree ?? villageTexture.tree(),
      tree.x,
      tree.y,
      32,
      48,
      tree.y,
    )
  }

  for (const building of VILLAGE_BUILDINGS) {
    const sprite = placeSprite(
      container,
      textures.buildings?.[building.kind] ??
        villageTexture.building(building.kind),
      building.x + building.width / 2,
      building.y + building.height,
      building.width,
      building.height,
      building.y + building.height,
    )
    if (onBuildingClick) {
      sprite.eventMode = 'static'
      sprite.label = `Gebäude: ${building.id}`
      sprite.cursor = 'pointer'
      sprite.on('pointertap', () => onBuildingClick(building.id))
    }
  }

  const residents = WALKERS.map((walker) =>
    placeSprite(
      container,
      textures.resident ?? villageTexture.resident(),
      walker.from,
      walker.y,
      16,
      24,
      walker.y,
    ),
  )

  return {
    container,
    update(elapsedMs) {
      WALKERS.forEach((walker, index) => {
        const period = 18_000 + index * 2_400
        const progress = (((elapsedMs / period + walker.offset) % 1) + 1) % 1
        const movingForward = progress < 0.5
        const fraction = movingForward ? progress * 2 : 2 - progress * 2
        const resident = residents[index]
        resident.x = walker.from + (walker.to - walker.from) * fraction
        resident.scale.x = movingForward ? 1 : -1
        resident.y = walker.y + (Math.floor(elapsedMs / 180 + index) % 2) * 2
      })
    },
  }
}

function variantAt(x: number, y: number): number {
  return ((((x / 32) * 7 + (y / 32) * 11) % 8) + 8) % 8
}
