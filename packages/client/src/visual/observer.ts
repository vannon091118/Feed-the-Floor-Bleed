import type { CombatLog, DungeonGrid, PathResult } from '@floor/sim-core'
import type {
  ActorDescriptor,
  FxDescriptor,
  TerrainPatch,
  TerrainTile,
  VisualDelta,
} from '../world'
import { combatFrame, routeActors } from './combat-frame'
import { buildTerrain, diffTerrain } from './terrain'

export interface ObserverInput {
  /** Die Grid-Quelle des Editors. Der Observer kopiert sie nicht. */
  grid: DungeonGrid
  /** Echte räumliche Route aus `findPath`. */
  route: PathResult
  /** Optionaler Core-Kampflog; ohne ihn läuft der Editor-Leerlauf. */
  combat: CombatLog | null
  /** Bis zu welchem Tick abgespielt wird. */
  playbackTick: number
}

export interface VisualObserver {
  observe(input: ObserverInput): VisualDelta
}

/**
 * Übersetzt Spielzustand in Präsentation.
 *
 * Der Observer besitzt bewusst keine zweite Grid-Wahrheit: Terrain wird nur
 * neu gelesen, wenn sich die Grid-Referenz ändert, und sonst als `null`
 * gemeldet. Genau so bleibt eine kleine Änderung an einem Monster ein
 * Akteur-Update statt eines Welt-Neuaufbaus.
 */
export function createVisualObserver(): VisualObserver {
  let revision = 0
  let lastGrid: DungeonGrid | null = null
  let cachedTerrain: TerrainTile[] | null = null
  let lastTick = 0

  return {
    observe(input: ObserverInput): VisualDelta {
      revision += 1
      let terrain: TerrainPatch | null = null
      if (input.grid !== lastGrid) {
        const next = buildTerrain(input.grid)
        terrain = diffTerrain(cachedTerrain, next)
        cachedTerrain = next
        lastGrid = input.grid
        if (!terrain.reset && terrain.changed.length === 0) terrain = null
      }

      let actors: ActorDescriptor[] = []
      const fx: FxDescriptor[] = []
      if (input.combat) {
        const fromTick = input.playbackTick < lastTick ? -1 : lastTick
        const frame = combatFrame(
          input.combat,
          input.route.path,
          input.playbackTick,
          fromTick,
        )
        actors = frame.actors
        fx.push(...frame.fx)
      } else {
        actors = routeActors(input.route.path)
      }
      lastTick = input.playbackTick

      return { revision, terrain, actors, fx }
    },
  }
}
