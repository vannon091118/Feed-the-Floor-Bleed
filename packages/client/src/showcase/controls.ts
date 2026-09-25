import { type DragDropCommand, createDragController } from '../input/drag'
import { actorAtWorld } from '../input/hit-test'
import { type PointerSample, bindPointer } from '../input/pointer'
import {
  type CameraState,
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

/**
 * Einheitliche Viewport-Steuerung.
 *
 * Treffer, Pan und Drag laufen alle über denselben Pointer-Pfad. Ein Klick ohne
 * Bewegung öffnet ein Fenster, ein Zug eines Actors endet als Drop-Command —
 * die Steuerung entscheidet keine Spielregel.
 */
export function bindViewportControls(deps: ControlsDeps): ViewportControls {
  let downScreen: { x: number; y: number } | null = null
  let panning = false

  const drag = createDragController({
    actors: deps.actors,
    camera: deps.camera,
    onDrop: (command) => deps.onDrop?.(command),
  })

  const handleUp = (sample: PointerSample): void => {
    const dragging = drag.active() !== null
    const wasPanning = panning
    panning = false
    const origin = downScreen
    downScreen = null
    drag.onUp(sample)
    if (dragging || wasPanning || !origin) return
    const moved = Math.hypot(
      sample.screen.x - origin.x,
      sample.screen.y - origin.y,
    )
    if (moved >= CLICK_SLOP) return
    const world = screenToWorld(deps.camera(), sample.screen)
    const id = actorAtWorld(deps.actors(), world, GRAB_RADIUS)
    if (!id) return
    const actor = deps.actors().find((entry) => entry.id === id)
    if (actor) deps.onActorClick?.(id, actor.kind)
  }

  const unbindPointer = bindPointer(deps.element, {
    onDown(sample) {
      downScreen = sample.screen
      drag.onDown(sample)
      panning = drag.active() === null
    },
    onMove(sample) {
      if (!panning || !downScreen) return
      deps.setCamera(
        panCamera(
          deps.camera(),
          downScreen.x - sample.screen.x,
          downScreen.y - sample.screen.y,
        ),
      )
      downScreen = sample.screen
    },
    onUp: handleUp,
    onCancel() {
      panning = false
      downScreen = null
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
