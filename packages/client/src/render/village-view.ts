import { optionalTexture } from './assets'
import { fitCamera } from './camera'
import type { VisualRuntime } from './runtime'
import { createVillageScene } from './village-scene'

export interface VillageView {
  resize(width: number, height: number): void
  update(elapsedMs: number): void
  dispose(): void
}

export function createVillageView(
  runtime: VisualRuntime,
  onBuildingClick?: (id: string) => void,
): VillageView {
  const container = runtime.layers.village
  container.removeChildren()
  const scene = createVillageScene(
    {
      ground: optionalTexture(runtime.assets, 'village.ground') ?? undefined,
      tree: optionalTexture(runtime.assets, 'village.tree') ?? undefined,
      resident:
        optionalTexture(runtime.assets, 'village.resident') ?? undefined,
      buildings: {
        hall:
          optionalTexture(runtime.assets, 'village.building.hall') ?? undefined,
        guild:
          optionalTexture(runtime.assets, 'village.building.guild') ??
          undefined,
        house:
          optionalTexture(runtime.assets, 'village.building.house') ??
          undefined,
        workshop:
          optionalTexture(runtime.assets, 'village.building.workshop') ??
          undefined,
      },
    },
    onBuildingClick,
  )
  container.addChild(scene.container)
  container.sortableChildren = true

  const resize = (width: number, height: number): void => {
    runtime.setCamera(
      fitCamera(
        { ...runtime.camera, viewportWidth: width, viewportHeight: height },
        'village',
      ),
    )
  }
  resize(runtime.camera.viewportWidth, runtime.camera.viewportHeight)

  return {
    resize,
    update: scene.update,
    dispose() {
      scene.container.destroy({ children: true })
      container.removeChildren()
      runtime.setCamera({
        ...runtime.camera,
        x: 0,
        y: 0,
        zoom: 1,
      })
    },
  }
}
