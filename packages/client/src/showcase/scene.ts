import type { DungeonGrid, PathResult } from '@floor/sim-core'
import type { DragDropCommand } from '../input/drag'
import { baseIdsBySlot } from '../raid/combat-source'
import { playbackLog, playbackRouteIndex, playbackTick } from '../raid/playback'
import {
  type CameraState,
  centerCameraOn,
  createCamera,
  fitCamera,
} from '../render/camera'
import { createDungeonScene } from '../render/dungeon-scene'
import { createLightingView } from '../render/lighting'
import type { DungeonRenderMode } from '../render/modes'
import type { VisualRuntime } from '../render/runtime'
import {
  type ActorDescriptor,
  type ActorKind,
  cellToWorld,
  WORLD_SIZE_PX,
} from '../world'
import { bindViewportControls } from './controls'

export interface ShowcaseDeps {
  runtime: VisualRuntime
  element: HTMLElement
  getGrid: () => DungeonGrid
  getRoute: () => PathResult
  getMode?: () => DungeonRenderMode
  onActorClick?: (actorId: string, kind: ActorKind) => void
  onDrop?: (command: DragDropCommand) => void
}

export interface Showcase {
  resize(width: number, height: number): void
  setMode(mode: DungeonRenderMode): void
  dispose(): void
}

function centerOnRoute(camera: CameraState, route: PathResult): CameraState {
  const path = route.path
  if (path.length === 0) {
    return centerCameraOn(camera, {
      x: WORLD_SIZE_PX / 2,
      y: WORLD_SIZE_PX / 2,
    })
  }
  const world = cellToWorld(path[Math.floor(path.length / 2)])
  return centerCameraOn(camera, world)
}

/**
 * Verbindet Observer, Kamera, Views und Pointer zu einer Pixi-Dungeon-Szene.
 *
 * Editor und Raid konsumieren dasselbe Grid und denselben VisualObserver. Der
 * Präsentationsmodus ändert nur Wandhöhe, Route-Deckkraft und Gridoverlay.
 * Core-Log, Route und Spielzustand bleiben außerhalb der Render-Ebene.
 */
export function createShowcase(deps: ShowcaseDeps): Showcase {
  const { runtime, element } = deps
  let mode = deps.getMode?.() ?? 'editor'
  runtime.setMode(mode)

  const dungeon = createDungeonScene(runtime, mode)
  const lighting = createLightingView(runtime)
  lighting.setVisible(mode === 'raid')

  /**
   * Die Dungeon-Welt ist 2048 Pixel breit; Zoom 1 zeigte vorher eine ganze
   * 512-Pixel-Welt und heute nur ein Viertel davon. Die Kamera rahmt die Welt
   * deshalb wie das Dorf, bevor sie auf die Route zentriert.
   *
   * Nur beim Aufbau: Danach gehört der Blick dem Spieler, und ein Resize darf
   * sein Pannen und Zoomen nicht zurücksetzen.
   */
  const framed = fitCamera(
    createCamera(runtime.camera.viewportWidth, runtime.camera.viewportHeight),
    'dungeon',
  )

  let camera = centerOnRoute(framed, deps.getRoute())
  runtime.setCamera(camera)

  let visibleActors: ActorDescriptor[] = []

  const controls = bindViewportControls({
    element,
    actors: () => visibleActors,
    camera: () => camera,
    setCamera(next) {
      camera = next
      runtime.setCamera(camera)
    },
    onActorClick: deps.onActorClick,
    onDrop: deps.onDrop,
  })

  const stopTick = runtime.onTick(({ deltaMs, elapsedMs }) => {
    // Die Szene liest den Raid-Store, sie besitzt ihn nicht: Log und Tick
    // kommen aus dem Raid-Fach und laufen im Dorf genauso weiter. Im
    // Editor-Modus zeigt die Szene die Leerlaufbesetzung der Route.
    const combat = mode === 'raid' ? (playbackLog.value?.log ?? null) : null
    dungeon.update({
      grid: deps.getGrid(),
      route: deps.getRoute(),
      combat,
      // Die Basisarten kommen aus dem Store-Fach, nicht aus der Einheiten-ID:
      // `monster-0` trägt keine Art, der belegte Slot schon.
      baseIds: baseIdsBySlot(),
      playbackTick: playbackTick.value,
      routeIndex: playbackRouteIndex.value,
      deltaMs,
      elapsedMs,
    })
    visibleActors = []
  })

  return {
    resize(width, height) {
      runtime.resize(width, height)
      camera = runtime.camera
      lighting.resize(width, height)
    },
    setMode(nextMode) {
      if (mode === nextMode) return
      mode = nextMode
      runtime.setMode(nextMode)
      dungeon.setMode(nextMode)
      lighting.setVisible(nextMode === 'raid')
    },
    dispose() {
      stopTick()
      controls.dispose()
      dungeon.dispose()
      lighting.dispose()
    },
  }
}
