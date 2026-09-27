import { grid, route } from '../dungeon-editor/state'
import type { DragDropCommand } from '../input'
import {
  bindCameraControls,
  type RenderMode,
  type VisualRuntime,
} from '../render'
import { createVillageView, type VillageView } from '../render/village-view'
import { createShowcase, type Showcase } from '../showcase'
import type { ActorKind } from '../world'

export interface SceneCallbacks {
  onActorClick: (actorId: string, kind: ActorKind) => void
  onBuildingClick: (buildingId: string) => void
  onDrop: (command: DragDropCommand) => void
}

export interface SceneSwitch {
  setCallbacks(callbacks: SceneCallbacks): void
  setMode(mode: RenderMode): void
  resize(width: number, height: number): void
  destroy(): void
}

/**
 * Hält genau eine lebende Szene in der stabilen Runtime.
 *
 * Dorf und Dungeon werden gebaut und abgeräumt, nicht nebeneinander gehalten;
 * die Pixi-Runtime und ihr Canvas bleiben dabei unangetastet. Callbacks kommen
 * über `setCallbacks`, damit Preact keine Szene neu bauen muss.
 */
export function createSceneSwitch(
  runtime: VisualRuntime,
  host: HTMLElement,
  initialMode: RenderMode,
  callbacks: SceneCallbacks,
): SceneSwitch {
  const handlers: SceneCallbacks = { ...callbacks }
  let showcase: Showcase | null = null
  let village: VillageView | null = null
  let release: (() => void) | null = null
  let mode = initialMode

  const destroyScene = (): void => {
    release?.()
    release = null
    showcase?.dispose()
    showcase = null
    village?.dispose()
    village = null
  }

  const resize = (width: number, height: number): void => {
    if (showcase) showcase.resize(width, height)
    else village?.resize(width, height)
  }

  const setMode = (next: RenderMode): void => {
    if (mode === next && (village || showcase)) return
    // Editor und Raid teilen sich die Dungeon-Szene; nur der Blick wechselt.
    if (mode !== 'village' && next !== 'village' && showcase) {
      mode = next
      runtime.setMode(next)
      showcase.setMode(next)
      return
    }
    destroyScene()
    mode = next
    runtime.setMode(next)
    if (next === 'village') {
      village = createVillageView(runtime, (id) => handlers.onBuildingClick(id))
      const stopTick = runtime.onTick(({ elapsedMs }) =>
        village?.update(elapsedMs),
      )
      const canvas = host.querySelector('canvas')
      const unbind = canvas
        ? bindCameraControls(
            canvas,
            'village',
            () => runtime.camera,
            (camera) => runtime.setCamera(camera),
          )
        : () => {}
      release = () => {
        unbind()
        stopTick()
      }
      return
    }
    showcase = createShowcase({
      runtime,
      element: host,
      getGrid: () => grid.value,
      getRoute: () => route.value,
      getMode: () => next,
      onActorClick: (id, kind) => handlers.onActorClick(id, kind),
      onDrop: (command) => handlers.onDrop(command),
    })
  }

  setMode(initialMode)

  return {
    setCallbacks(next) {
      Object.assign(handlers, next)
    },
    setMode,
    resize,
    destroy: destroyScene,
  }
}
