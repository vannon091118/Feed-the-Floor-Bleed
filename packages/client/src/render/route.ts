import type { Point } from '@floor/sim-core'
import { Sprite } from 'pixi.js'
import { WORLD_CELL_PX, cellFoot } from '../world'
import { depthValue } from './depth'
import { routeTexture } from './route-atlas'
import type { VisualRuntime } from './runtime'

export interface RouteView {
  apply(path: readonly Point[], activeIndex?: number): void
  dispose(): void
}

/** Rendert nur eine Ableitung von route.path; besitzt keine Raumdaten selbst. */
export function createRouteView(runtime: VisualRuntime): RouteView {
  const markers: Array<{ sprite: Sprite; index: number }> = []
  let currentPath: readonly Point[] | null = null
  let activeIndex = -1
  let pathStride = 1

  const updateActive = (nextIndex: number): void => {
    if (activeIndex === nextIndex) return
    activeIndex = nextIndex
    for (const marker of markers) {
      const active =
        nextIndex >= 0 && Math.abs(marker.index - nextIndex) <= pathStride
      marker.sprite.texture = routeTexture(active ? 'blue' : 'gold')
      marker.sprite.alpha = active ? 0.92 : 0.54
      const size = WORLD_CELL_PX * (active ? 2.5 : 2)
      marker.sprite.width = size
      marker.sprite.height = size
    }
  }

  return {
    apply(path, nextActiveIndex = -1) {
      if (currentPath !== path) {
        currentPath = path
        for (const marker of markers) {
          marker.sprite.parent?.removeChild(marker.sprite)
          marker.sprite.destroy()
        }
        markers.length = 0
        pathStride = path.length > 100 ? Math.ceil(path.length / 100) : 1
        for (let index = 0; index < path.length; index += pathStride) {
          const foot = cellFoot(path[index])
          const sprite = new Sprite(routeTexture('gold'))
          sprite.anchor.set(0.5)
          sprite.position.set(foot.x, foot.y - WORLD_CELL_PX * 0.45)
          sprite.zIndex = depthValue(foot.y, 1, 1)
          runtime.layers.world.addChild(sprite)
          markers.push({ sprite, index })
        }
        activeIndex = -1
      }
      updateActive(nextActiveIndex)
    },
    dispose() {
      for (const marker of markers) {
        marker.sprite.parent?.removeChild(marker.sprite)
        marker.sprite.destroy()
      }
      markers.length = 0
    },
  }
}
