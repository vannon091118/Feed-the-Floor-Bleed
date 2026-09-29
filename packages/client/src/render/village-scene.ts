import { Container, type Texture } from 'pixi.js'
import { villageTexture } from './village-atlas'
import {
  drawVillageGround,
  placeSprite,
  type VillageGroundTextures,
} from './village-ground'
import { type BuildingKind, VILLAGE_BUILDINGS } from './village-layout'

/**
 * Was sich im Dorf bewegt oder angeklickt werden kann.
 *
 * Der Untergrund liegt in `village-ground.ts`; hier bleiben die Gebäude mit
 * ihrer Klickverdrahtung, die laufenden Bewohner und ihre Bewegung. Der
 * Schnitt ist die Naht der künftigen Verdrahtung: Sobald die Szene den
 * Dorfbestand des Stores statt der Präsentationsorte aus `village-layout.ts`
 * liest, tauscht sie ihre Gebäudeschleife und lässt das Bild darunter
 * unberührt.
 */
export interface VillageTextures extends VillageGroundTextures {
  resident?: Texture
  buildings?: Partial<Record<BuildingKind, Texture>>
}

export interface VillageScene {
  container: Container
  update(elapsedMs: number): void
}

export type { BuildingKind } from './village-layout'

const WALKERS = [
  { from: 120, to: 820, y: 355, offset: 0 },
  { from: 165, to: 870, y: 510, offset: 0.38 },
  { from: 130, to: 745, y: 325, offset: 0.7 },
  { from: 260, to: 910, y: 575, offset: 0.2 },
] as const

/**
 * Pixel-Dorf mit anklickbaren Gebäuden und deterministischer Bewohnerbewegung.
 *
 * Der Aufbau ist zweigeteilt und in dieser Reihenfolge bindend: erst der
 * unbewegliche Untergrund, dann die Gebäude, zuletzt die Bewohner. Die
 * Bewohner sind damit die letzten Kinder des Containers, und die Tiefe jedes
 * Sprites kommt aus seinem Fußpunkt, weil der Container sortiert.
 *
 * Ein fehlendes Bild ist kein Fehler: Für jede Textur gilt der Rückfall auf die
 * prozedurale Fassung, und die Texturmenge darf leer bleiben. Ohne
 * Klickempfänger sind die Gebäude sichtbar, aber nicht anklickbar — die
 * Entscheidung liegt beim Aufrufer, hier gibt es keinen stillen Standard.
 */
export function createVillageScene(
  textures: VillageTextures = {},
  onBuildingClick?: (id: string) => void,
): VillageScene {
  const container = new Container()
  container.sortableChildren = true

  drawVillageGround(container, textures)

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
