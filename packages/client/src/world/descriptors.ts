import type { Point } from '@floor/sim-core'
import type { WorldPoint } from './geometry'

export type ActorKind = 'hero' | 'monster' | 'boss'
export type FxKind =
  | 'dust'
  | 'hit'
  | 'spark'
  | 'magic'
  | 'smoke'
  | 'blood'
  | 'ambient'

/**
 * Ein sichtbares Objekt. Enthält bewusst Weltkoordinate *und* Herkunftszelle:
 * Die Zelle kommt aus Grid/Route, `world` ist daraus abgeleitet. Die Runtime
 * rechnet nie selbst zurück auf Spielwahrheit.
 */
export interface ActorDescriptor {
  id: string
  kind: ActorKind
  cell: Point
  world: WorldPoint
  height: number
  hpRatio: number
  facing: 1 | -1
  moving: boolean
  variant: number
}

export interface TerrainTile {
  index: number
  cell: Point
  materialId: string
  variant: number
  height: number
  occludes: boolean
  seed: number
}

export interface FxDescriptor {
  kind: FxKind
  world: WorldPoint
  amount: number
}

/**
 * Vollständiger Präsentationszustand.
 *
 * `revision` zählt Beobachtungszyklen. Die Runtime benutzt ihn, um unveränderte
 * Rahmen zu überspringen, statt die Welt neu aufzubauen.
 */
export interface VisualState {
  revision: number
  terrain: TerrainTile[]
  actors: ActorDescriptor[]
}

/** Nur die Änderungen seit der letzten Beobachtung. */
export interface TerrainPatch {
  reset: boolean
  changed: TerrainTile[]
}

export interface VisualDelta {
  revision: number
  terrain: TerrainPatch | null
  actors: ActorDescriptor[]
  fx: FxDescriptor[]
}
