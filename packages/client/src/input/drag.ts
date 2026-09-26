import type { CameraState } from '../render/camera'
import type { ActorDescriptor } from '../world'
import {
  advance,
  type DragDropCommand,
  type DragState,
  dropCommand,
  passedSlop,
  resolveTarget,
} from './drag-target'
import type { PointerSample } from './pointer'

export type { DragDropCommand, DragKind, DragState } from './drag-target'

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
  hasCandidate(): boolean
  subscribe(listener: (state: DragState | null) => void): () => void
}

/**
 * Einheitliche Drag-Schicht.
 *
 * Sie kennt nur Treffer, Ziel und Abschluss. Der Drop ruft `onDrop` mit einem
 * Command auf und enthält selbst keine Spielregel: Ob ein Monster in einen
 * Zuchtplatz darf, entscheidet weiterhin der bestehende Core-Aufruf.
 *
 * Ein Pointer-Down allein ist noch kein Drag. Er registriert nur einen
 * Kandidaten; erst eine Bewegung über den Slop macht daraus einen aktiven Zug.
 * Ohne diese Trennung wäre jeder Klick auf einen Actor gleichzeitig ein Drop,
 * und der Klickpfad zum Kontextfenster käme nie zum Zug.
 */
export function createDragController(deps: DragDependencies): DragController {
  let candidate: DragState | null = null
  let state: DragState | null = null
  const listeners = new Set<(state: DragState | null) => void>()

  const notify = (): void => {
    for (const listener of listeners) listener(state)
  }

  const clear = (): void => {
    candidate = null
    if (state === null) return
    state = null
    notify()
  }

  return {
    onDown(sample) {
      candidate = resolveTarget(deps.camera(), deps.actors(), sample.screen)
      if (state === null) return
      state = null
      notify()
    },
    onMove(sample) {
      const current = state
      if (!candidate) return
      if (current === null) {
        if (!passedSlop(candidate.screen, sample.screen)) return
        state = advance(candidate, deps.camera(), sample.screen)
        notify()
        return
      }
      state = advance(current, deps.camera(), sample.screen)
      notify()
    },
    onUp(sample) {
      if (!state) {
        clear()
        return
      }
      const command = dropCommand(state, deps.camera(), sample.screen)
      clear()
      deps.onDrop(command)
    },
    cancel() {
      clear()
    },
    active() {
      return state
    },
    hasCandidate() {
      return candidate !== null
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
