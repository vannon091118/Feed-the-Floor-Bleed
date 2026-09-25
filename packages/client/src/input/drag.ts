import type { Point } from '@floor/sim-core'
import type { CameraState, ScreenPoint } from '../render/camera'
import type { ActorDescriptor } from '../world'
import { actorAtWorld, cellAtScreen, worldAtScreen } from './hit-test'
import type { PointerSample } from './pointer'

export type DragKind = 'actor' | 'item' | 'tile'

export interface DragDropCommand {
  source: DragKind
  id: string
  cell: Point
  screen: ScreenPoint
}

export interface DragState {
  source: DragKind
  id: string
  cell: Point
  screen: ScreenPoint
}

export interface DragDependencies {
  actors: () => readonly ActorDescriptor[]
  camera: () => CameraState
  onDrop: (command: DragDropCommand) => void
}

export interface DragController {
  onDown(sample: PointerSample): void
  onMove(sample: PointerSample): void
  onUp(sample: PointerSample): void
  cancel(): void
  active(): DragState | null
  subscribe(listener: (state: DragState | null) => void): () => void
}

const GRAB_RADIUS = 12

/**
 * Einheitliche Drag-Schicht.
 *
 * Sie kennt nur Treffer, Ziel und Abschluss. Der Drop ruft `onDrop` mit einem
 * Command auf und enthält selbst keine Spielregel: Ob ein Monster in einen
 * Zuchtplatz darf, entscheidet weiterhin der bestehende Core-Aufruf.
 */
export function createDragController(deps: DragDependencies): DragController {
  let state: DragState | null = null
  const listeners = new Set<(state: DragState | null) => void>()

  const notify = (): void => {
    for (const listener of listeners) listener(state)
  }

  return {
    onDown(sample) {
      const world = worldAtScreen(deps.camera(), sample.screen)
      const id = actorAtWorld(deps.actors(), world, GRAB_RADIUS)
      state = id
        ? {
            source: 'actor',
            id,
            cell: cellAtScreen(deps.camera(), sample.screen),
            screen: sample.screen,
          }
        : null
      if (state) notify()
    },
    onMove(sample) {
      if (!state) return
      state = {
        ...state,
        cell: cellAtScreen(deps.camera(), sample.screen),
        screen: sample.screen,
      }
      notify()
    },
    onUp(sample) {
      if (!state) return
      const command: DragDropCommand = {
        source: state.source,
        id: state.id,
        cell: cellAtScreen(deps.camera(), sample.screen),
        screen: sample.screen,
      }
      state = null
      notify()
      deps.onDrop(command)
    },
    cancel() {
      if (!state) return
      state = null
      notify()
    },
    active() {
      return state
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
