import { createDragController, type DragDropCommand } from '../input/drag'
import { DRAG_SLOP, GRAB_RADIUS } from '../input/drag-target'
import { actorAtWorld } from '../input/hit-test'
import { bindPointer, type PointerSample } from '../input/pointer'
import type { ActorDescriptor, ActorKind } from '../world'
import {
  type CameraState,
  type CameraWorld,
  panCamera,
  type ScreenPoint,
  screenToWorld,
  ZOOM_STEP_IN,
  ZOOM_STEP_OUT,
  zoomCamera,
} from './camera'
import { bindCameraKeys } from './camera-keys'

export interface ViewportControlsDeps {
  element: HTMLElement
  world: CameraWorld
  camera: () => CameraState
  setCamera: (camera: CameraState) => void
  /**
   * Die Trefferschicht. Fehlt sie, ist die Fläche eine reine Kamera: Dorf und
   * Dungeon teilen dieselbe Geste, aber nur der Dungeon hat Actors, die man
   * greifen und fallen lassen kann.
   */
  actors?: () => readonly ActorDescriptor[]
  onActorClick?: (actorId: string, kind: ActorKind) => void
  onDrop?: (command: DragDropCommand) => void
}

export interface ViewportControls {
  dispose(): void
}

/** Vor dem Slop ist noch offen, ob die Geste ein Drag oder ein Pan wird. */
type GestureMode = 'undecided' | 'drag' | 'pan'

/**
 * Eine Viewport-Steuerung für Dorf und Dungeon.
 *
 * Treffer, Pan und Drag laufen über dieselbe Schwelle (`DRAG_SLOP` und
 * `GRAB_RADIUS` aus `input/drag-target`): die Richtung steht erst nach dem Slop
 * fest — auf einem Actor beginnt ein Drag, in der leeren Welt ein Pan. Ein Down
 * ohne Weg bleibt ein Klick und öffnet ein Fenster. Die Steuerung entscheidet
 * dabei keine Spielregel; sie übersetzt Zeiger und Tasten in Kamerazustand und
 * Drop-Commands.
 *
 * Vorher lagen hier zwei Systeme: dieser Pfad im Dungeon und eine zweite,
 * schmalere Fassung im Dorf mit eigener Schwelle (4 statt 5) und eigener
 * Zoomregel. Eine Geste mit zwei Zahlen fühlt sich je nach Blick anders an; es
 * gibt jetzt eine.
 *
 * **Warum die Trefferschicht freiwillig ist und woran der Capture hängt:** Die
 * Dorfszene hängt ihre Gebäudeklicks als Pixi-`pointertap` an die Sprites.
 * `setPointerCapture` richtet alle folgenden Zeigerereignisse an die Fläche
 * selbst; die Leinwand als Kind bekäme sie nicht mehr, und der Klick auf ein
 * Haus fiele aus. Nur die Welt mit Actors greift deshalb mit Capture; dieselbe
 * Bindung fährt im Dorf ohne.
 */
export function bindViewportControls(
  deps: ViewportControlsDeps,
): ViewportControls {
  const { element, world } = deps
  let downScreen: ScreenPoint | null = null
  let mode: GestureMode = 'undecided'
  const drag = deps.actors
    ? createDragController({
        actors: deps.actors,
        camera: deps.camera,
        onDrop: (command) => deps.onDrop?.(command),
      })
    : null

  const reset = (): void => {
    downScreen = null
    mode = 'undecided'
  }

  const panBy = (dx: number, dy: number): void => {
    deps.setCamera(panCamera(deps.camera(), dx, dy, world))
  }

  const onWheel = (event: WheelEvent): void => {
    event.preventDefault()
    const step = event.deltaY < 0 ? ZOOM_STEP_IN : ZOOM_STEP_OUT
    deps.setCamera(zoomCamera(deps.camera(), step, world))
  }
  element.addEventListener('wheel', onWheel, { passive: false })

  const onDown = (sample: PointerSample): void => {
    downScreen = sample.screen
    mode = 'undecided'
    drag?.onDown(sample)
  }

  const onMove = (sample: PointerSample): void => {
    const origin = downScreen
    if (!origin) return
    if (mode === 'undecided') {
      if (
        Math.hypot(sample.screen.x - origin.x, sample.screen.y - origin.y) <
        DRAG_SLOP
      )
        return
      mode = drag?.hasCandidate() ? 'drag' : 'pan'
    }
    if (mode === 'drag') {
      drag?.onMove(sample)
      return
    }
    panBy(origin.x - sample.screen.x, origin.y - sample.screen.y)
    downScreen = sample.screen
  }

  const onUp = (sample: PointerSample): void => {
    const ended = mode
    reset()
    if (ended === 'drag') {
      drag?.onUp(sample)
      return
    }
    if (ended === 'pan') {
      drag?.cancel()
      return
    }
    const actors = deps.actors?.() ?? []
    const id = actorAtWorld(
      actors,
      screenToWorld(deps.camera(), sample.screen),
      GRAB_RADIUS,
    )
    drag?.cancel()
    if (!id) return
    const actor = actors.find((entry) => entry.id === id)
    if (actor) deps.onActorClick?.(id, actor.kind)
  }

  const unbindPointer = bindPointer(element, {
    /** Ohne Actors gibt es nichts zu greifen; der Capture fiele nur dem Dorf ins Haus. */
    capture: deps.actors !== undefined,
    onDown,
    onMove,
    onUp,
    onCancel() {
      reset()
      drag?.cancel()
    },
  })

  const unbindKeys = bindCameraKeys(element, world, deps.camera, deps.setCamera)

  return {
    dispose() {
      unbindPointer()
      unbindKeys()
      element.removeEventListener('wheel', onWheel)
      drag?.cancel()
      reset()
    },
  }
}
