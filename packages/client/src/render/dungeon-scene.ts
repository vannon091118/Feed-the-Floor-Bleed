import type { CombatLog, DungeonGrid, PathResult } from '@floor/sim-core'
import { createVisualObserver } from '../visual'
import { createActorsView } from './actors'
import { createEditorGridView } from './editor-grid'
import { createEditorOverlay } from './editor-overlay'
import { createFxView } from './fx'
import type { DungeonRenderMode } from './modes'
import { createRouteView } from './route'
import type { VisualRuntime } from './runtime'
import { createTerrainView } from './terrain'

export interface DungeonScene {
  update(input: {
    grid: DungeonGrid
    route: PathResult
    combat: CombatLog | null
    baseIds?: readonly (string | undefined)[]
    playbackTick: number
    routeIndex: number
    deltaMs: number
    elapsedMs: number
  }): void
  setMode(mode: DungeonRenderMode): void
  dispose(): void
}

export function createDungeonScene(
  runtime: VisualRuntime,
  initialMode: DungeonRenderMode,
): DungeonScene {
  let mode = initialMode
  let latest: { grid: DungeonGrid; route: PathResult } | null = null
  const observer = createVisualObserver()
  const terrain = createTerrainView(runtime, mode)
  const routeView = createRouteView(runtime, mode)
  const grid = createEditorGridView(runtime)
  const overlay = createEditorOverlay(runtime)
  const actors = createActorsView(runtime)
  const fx = createFxView(runtime)
  grid.setVisible(mode === 'editor')
  overlay.setVisible(mode === 'editor')

  return {
    update(input) {
      latest = { grid: input.grid, route: input.route }
      const delta = observer.observe({
        grid: input.grid,
        route: input.route,
        combat: input.combat,
        baseIds: input.baseIds,
        playbackTick: input.playbackTick,
      })
      terrain.apply(delta.terrain)
      if (mode === 'editor' && delta.terrain) {
        overlay.update(input.grid, input.route)
      }
      routeView.apply(input.route.path, input.routeIndex)
      actors.apply(delta.actors)
      fx.emit(delta.fx)
      fx.update(input.deltaMs)
      actors.update(input.elapsedMs)
    },
    setMode(nextMode) {
      if (mode === nextMode) return
      mode = nextMode
      terrain.setMode(nextMode)
      routeView.setMode(nextMode)
      grid.setVisible(nextMode === 'editor')
      overlay.setVisible(nextMode === 'editor')
      if (nextMode === 'editor' && latest) {
        overlay.update(latest.grid, latest.route)
      }
    },
    dispose() {
      terrain.dispose()
      routeView.dispose()
      grid.dispose()
      overlay.dispose()
      actors.dispose()
      fx.dispose()
    },
  }
}
