import type { Point } from '@floor/sim-core'
import type { CameraState, ScreenPoint } from '../render/camera'
import type { ActorDescriptor } from '../world'
import { actorAtWorld, cellAtScreen, worldAtScreen } from './hit-test'

export type DragKind = 'actor' | 'item' | 'tile'

export interface DragState {
  source: DragKind
  id: string
  cell: Point
  screen: ScreenPoint
}

export interface DragDropCommand {
  source: DragKind
  id: string
  cell: Point
  screen: ScreenPoint
}

/** Greifradius in Weltkoordinaten, damit er mit dem Zoom skaliert. */
export const GRAB_RADIUS = 12

/** Weg, ab dem aus einem Kandidaten ein aktiver Zug wird. */
export const DRAG_SLOP = 5

/**
 * Treffer auflösen: Welcher Actor liegt unter diesem Screen-Punkt?
 *
 * Liefert den Kandidaten für einen Zug, aber noch keinen aktiven Drag. Der
 * Aufrufer entscheidet über `passedSlop`, ob daraus ein Zug wird.
 */
export function resolveTarget(
  camera: CameraState,
  actors: readonly ActorDescriptor[],
  screen: ScreenPoint,
): DragState | null {
  const id = actorAtWorld(actors, worldAtScreen(camera, screen), GRAB_RADIUS)
  if (!id) return null
  return { source: 'actor', id, cell: cellAtScreen(camera, screen), screen }
}

/** Erst ab diesem Weg wird aus dem Kandidaten ein aktiver Zug. */
export function passedSlop(from: ScreenPoint, to: ScreenPoint): boolean {
  return Math.hypot(to.x - from.x, to.y - from.y) >= DRAG_SLOP
}

/** Ziel und Anzeigepunkt eines laufenden Zugs auf den aktuellen Sample ziehen. */
export function advance(
  state: DragState,
  camera: CameraState,
  screen: ScreenPoint,
): DragState {
  return { ...state, cell: cellAtScreen(camera, screen), screen }
}

/** Abschluss-Command eines aktiven Zugs. Enthält keine Spielregel. */
export function dropCommand(
  state: DragState,
  camera: CameraState,
  screen: ScreenPoint,
): DragDropCommand {
  return {
    source: state.source,
    id: state.id,
    cell: cellAtScreen(camera, screen),
    screen,
  }
}
