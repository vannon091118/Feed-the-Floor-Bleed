import { type DragDropCommand, createDragController } from '../input/drag'
import { actorAtWorld } from '../input/hit-test'
import { type PointerSample, bindPointer } from '../input/pointer'
import {
  type CameraState,
  type ScreenPoint,
  panCamera,
  screenToWorld,
  zoomCamera,
} from '../render/camera'
import type { ActorDescriptor, ActorKind } from '../world'

export interface ControlsDeps {
  element: HTMLElement
  actors: () => readonly ActorDescriptor[]
  camera: () => CameraState
  setCamera: (camera: CameraState) => void
  onActorClick?: (actorId: string, kind: ActorKind) => void
  onDrop?: (command: DragDropCommand) => void
}

export interface ViewportControls {
  dispose(): void
}

const CLICK_SLOP = 5
const GRAB_RADIUS = 12

/** Vor dem Slop ist noch offen, ob die Geste ein Drag oder ein Pan wird. */
type GestureMode = 'undecided' | 'drag' | 'pan'

/**
 * Einheitliche Viewport-Steuerung.
 *
 * Treffer, Pan und Drag laufen alle über denselben Pointer-Pfad. Die Richtung
 * steht erst nach `CLICK_SLOP` fest: Auf einem Actor beginnt ein Drag, in der
 * leeren Welt ein Pan. Ein Down ohne Weg bleibt ein Klick und öffnet ein
 * Fenster, statt einen Drop auszulösen — die Steuerung entscheidet dabei keine
 * Spielregel.
 */
export function bindViewportControls(deps: ControlsDeps): ViewportControls {
  let downScreen: ScreenPoint | null = null
  let mode: GestureMode = 'undecided'

  const drag = createDragController({
    actors: deps.actors,
    camera: deps.camera,
    onDrop: (command) => deps.onDrop?.(command),
  })

  const reset = (): void => {
    downScreen = null
    mode = 'undecided'
  }

  const handleUp = (sample: PointerSample): void => {
    const ended = mode
    reset()
    if (ended === 'drag') {
      drag.onUp(sample)
      return
    }
    if (ended === 'pan') {
      drag.cancel()
      return
    }
    const world = screenToWorld(deps.camera(), sample.screen)
    const id = actorAtWorld(deps.actors(), world, GRAB_RADIUS)
    drag.cancel()
    if (!id) return
    const actor = deps.actors().find((entry) => entry.id === id)
    if (actor) deps.onActorClick?.(id, actor.kind)
  }

  const unbindPointer = bindPointer(deps.element, {
    onDown(sample) {
      downScreen = sample.screen
      mode = 'undecided'
      drag.onDown(sample)
    },
    onMove(sample) {
      const origin = downScreen
      if (!origin) return
      if (mode === 'undecided') {
        const moved = Math.hypot(
          sample.screen.x - origin.x,
          sample.screen.y - origin.y,
        )
        if (moved < CLICK_SLOP) return
        mode = drag.hasCandidate() ? 'drag' : 'pan'
      }
      if (mode === 'drag') {
        drag.onMove(sample)
        return
      }
      deps.setCamera(
        panCamera(
          deps.camera(),
          origin.x - sample.screen.x,
          origin.y - sample.screen.y,
        ),
      )
      downScreen = sample.screen
    },
    onUp: handleUp,
    onCancel() {
      reset()
      drag.cancel()
    },
  })

  const onWheel = (event: WheelEvent): void => {
    deps.setCamera(zoomCamera(deps.camera(), event.deltaY < 0 ? 1.1 : 0.9))
  }
  deps.element.addEventListener('wheel', onWheel)

  return {
    dispose() {
      unbindPointer()
      deps.element.removeEventListener('wheel', onWheel)
      drag.cancel()
    },
  }
}
