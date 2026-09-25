import type { CombatLog, DungeonGrid, PathResult } from '@floor/sim-core'
import type { DragDropCommand } from '../input/drag'
import {
  type VisualRuntime,
  createActorsView,
  createFxView,
  createLightingView,
  createTerrainView,
} from '../render'
import {
  type CameraState,
  centerCameraOn,
  createCamera,
} from '../render/camera'
import { createVisualObserver } from '../visual'
import {
  type ActorDescriptor,
  type ActorKind,
  WORLD_SIZE_PX,
  cellToWorld,
} from '../world'
import { buildCombatLog } from './combat-source'
import { bindViewportControls } from './controls'

export interface ShowcaseDeps {
  runtime: VisualRuntime
  element: HTMLElement
  getGrid: () => DungeonGrid
  getRoute: () => PathResult
  onActorClick?: (actorId: string, kind: ActorKind) => void
  onDrop?: (command: DragDropCommand) => void
}

export interface Showcase {
  resize(width: number, height: number): void
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
  return centerCameraOn(camera, { x: world.x, y: world.y })
}

/**
 * Verbindet Beobachter, Kamera, Views und Pointer zu einer sichtbaren Szene.
 *
 * Alle Positionen stammen aus `grid`/`route`, die Kampfpositionen aus dem
 * echten Core-Log. Die Szene hält nur abgeleitete Präsentationsdaten und
 * schreibt nie in Grid oder Core zurück.
 */
export function createShowcase(deps: ShowcaseDeps): Showcase {
  const { runtime, element } = deps
  const terrain = createTerrainView(runtime)
  const actors = createActorsView(runtime)
  const fx = createFxView(runtime)
  const lighting = createLightingView(runtime)
  const observer = createVisualObserver()

  let camera = centerOnRoute(
    createCamera(runtime.camera.viewportWidth, runtime.camera.viewportHeight),
    deps.getRoute(),
  )
  runtime.setCamera(camera)

  let combat: CombatLog | null = null
  let combatGrid: DungeonGrid | null = null
  let playback = 0
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
    const grid = deps.getGrid()
    const route = deps.getRoute()
    if (grid !== combatGrid) {
      combatGrid = grid
      playback = 0
      combat = buildCombatLog(grid, route)
    }
    if (combat) {
      playback += deltaMs / (1000 / combat.config.tickRate)
      if (playback > combat.ticks + 30) playback = 0
    }
    const delta = observer.observe({
      grid,
      route,
      combat,
      playbackTick: Math.floor(playback),
    })
    terrain.apply(delta.terrain)
    actors.apply(delta.actors)
    visibleActors = delta.actors
    fx.emit(delta.fx)
    fx.update(deltaMs)
    actors.update(elapsedMs)
  })

  return {
    resize(width, height) {
      runtime.resize(width, height)
      camera = runtime.camera
      lighting.resize(width, height)
    },
    dispose() {
      stopTick()
      controls.dispose()
      terrain.dispose()
      actors.dispose()
      fx.dispose()
      lighting.dispose()
    },
  }
}
