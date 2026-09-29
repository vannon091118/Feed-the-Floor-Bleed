import { Container, type Sprite, type Texture } from 'pixi.js'
import { villageTexture } from './village-atlas'
import {
  drawVillageGround,
  placeSprite,
  type VillageGroundTextures,
} from './village-ground'
import {
  type BuildingKind,
  projectVillagePlot,
  type VillagePlots,
} from './village-layout'

/**
 * Was sich im Dorf bewegt oder angeklickt werden kann.
 *
 * Der Untergrund liegt in `village-ground.ts`; hier bleiben die Gebäude mit
 * ihrer Klickverdrahtung, die laufenden Bewohner und ihre Bewegung. Die
 * Gebäude stammen aus dem Dorfbestand, den die UI als `plots` hereinreicht:
 * Diese Schicht führt keinen zweiten Bestand, sie liest bei jedem Takt und
 * legt nur neu an, wenn sich die Zellen tatsächlich ändern.
 */
export interface VillageTextures extends VillageGroundTextures {
  resident?: Texture
  buildings?: Partial<Record<BuildingKind, Texture>>
}

export interface VillageScene {
  container: Container
  update(elapsedMs: number): void
}

export interface VillageSceneOptions {
  /** Der Dorfbestand als Plotraster; wird bei jedem Takt neu gelesen. */
  plots(): VillagePlots
  /** Der Listenplatz des angeklickten Gebäudes — dieselbe Kennung wie im Store. */
  onBuildingClick?(index: number): void
}

export type { BuildingKind } from './village-layout'

const WALKERS = [
  { from: 120, to: 820, y: 355, offset: 0 },
  { from: 165, to: 870, y: 510, offset: 0.38 },
  { from: 130, to: 745, y: 325, offset: 0.7 },
  { from: 260, to: 910, y: 575, offset: 0.2 },
] as const

/** Der Anblick eines Plots als Signatur; nur bei Änderung wird neu gebaut. */
function signatur(plots: VillagePlots): string {
  const zellen = plots.buildings
    .map(
      ({ kind, footprint }) =>
        `${kind}:${footprint.x},${footprint.y},${footprint.width},${footprint.height}`,
    )
    .join('|')
  return `${plots.grid.columns}x${plots.grid.rows}@${zellen}`
}

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
 * Entscheidung liegt beim Aufrufer, hier gibt es keinen stillen Standard. Der
 * Standort eines Gebäudes ist dagegen nie still: Er ist die Projektion seiner
 * Zellen und wird aus dem Store geliefert.
 */
export function createVillageScene(
  textures: VillageTextures = {},
  options: VillageSceneOptions,
): VillageScene {
  const container = new Container()
  container.sortableChildren = true

  drawVillageGround(container, textures)

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

  const onClick = options.onBuildingClick
  let gebaute: Sprite[] = []
  let letzteSignatur: string | null = null

  const syncBuildings = (): void => {
    const plots = options.plots()
    const next = signatur(plots)
    if (next === letzteSignatur) return
    letzteSignatur = next
    for (const sprite of gebaute) sprite.destroy()
    gebaute = plots.buildings.map(({ kind, footprint }, index) => {
      const rect = projectVillagePlot(footprint, plots.grid)
      const sprite = placeSprite(
        container,
        textures.buildings?.[kind] ?? villageTexture.building(kind),
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        rect.y,
      )
      // Die Beschriftung ist die Kennung des Sprites, nicht die Verdrahtung:
      // Sie steht auch ohne Klickempfänger am Kind.
      sprite.label = `Gebäude: ${kind}`
      if (onClick) {
        sprite.eventMode = 'static'
        sprite.cursor = 'pointer'
        sprite.on('pointertap', () => onClick(index))
      }
      return sprite
    })
    // Die Bewohner bleiben die letzten Kinder: Ohne Renderlauf sortiert der
    // Container nicht, und die Zeichenfolge ist hier die Tiefenordnung.
    for (const resident of residents) container.addChild(resident)
  }

  syncBuildings()

  return {
    container,
    update(elapsedMs) {
      syncBuildings()
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
