import { Application, Container, type Texture } from 'pixi.js'
import { loadAssetTextures } from './assets'
import {
  type CameraState,
  createCamera,
  resizeCamera,
  worldToScreen,
} from './camera'
import { LAYER_NAMES, type LayerName, layerZ } from './layers'
import type { RenderMode } from './modes'

export interface TickInfo {
  deltaMs: number
  elapsedMs: number
}

export type TickHandler = (info: TickInfo) => void

/**
 * Die Pixi-Runtime. Sie besitzt Stage, Ebenen, Ticker und Kamera.
 *
 * Preact liefert nur das Host-Element und ruft `createVisualRuntime` einmal.
 * Danach gehört die Szene Pixi: Die UI rendert keine Sprites als Komponenten.
 */
export interface VisualRuntime {
  app: Application
  layers: Record<LayerName, Container>
  assets: ReadonlyMap<string, Texture>
  readonly camera: CameraState
  readonly mode: RenderMode
  setMode(mode: RenderMode): void
  onTick(handler: TickHandler): () => void
  setCamera(camera: CameraState): void
  resize(width: number, height: number): void
  dispose(): void
}

function buildLayers(): Record<LayerName, Container> {
  const layers = {} as Record<LayerName, Container>
  for (const name of LAYER_NAMES) {
    const container = new Container()
    container.zIndex = layerZ(name)
    layers[name] = container
  }
  return layers
}

export async function createVisualRuntime(
  host: HTMLElement,
): Promise<VisualRuntime> {
  const width = Math.max(1, host.clientWidth || 640)
  const height = Math.max(1, host.clientHeight || 480)
  const app = new Application()
  await app.init({
    background: 0x0b0e14,
    antialias: true,
    width,
    height,
    resolution: Math.min(2, window.devicePixelRatio || 1),
    autoDensity: true,
  })
  host.appendChild(app.canvas)

  const assets = await loadAssetTextures()
  const layers = buildLayers()
  layers.world.sortableChildren = true
  layers.editor.sortableChildren = true
  layers.village.sortableChildren = true
  const worldRoot = new Container()
  worldRoot.sortableChildren = true
  worldRoot.zIndex = 15
  worldRoot.addChild(
    layers.terrain,
    layers.world,
    layers.editor,
    layers.village,
  )
  app.stage.sortableChildren = true
  app.stage.addChild(layers.void, worldRoot, layers.overlay)

  const handlers = new Set<TickHandler>()
  let camera = createCamera(width, height)
  let elapsedMs = 0
  let mode: RenderMode = 'editor'

  /**
   * Setzt den Weltcontainer über die kanonische Transformation.
   *
   * Die Container-Matrix entspricht genau `worldToScreen`: Ein Weltpunkt wird
   * mit dem Zoom skaliert und um den Bildschirmursprung verschoben. Deshalb
   * wird hier kein zweites Mal gerechnet, sondern der Ursprung aus `camera.ts`
   * geholt. Sonst könnten Renderer, Hit-Test und Drag auseinanderlaufen.
   */
  const applyCamera = (): void => {
    const origin = worldToScreen(camera, { x: 0, y: 0 })
    worldRoot.scale.set(camera.zoom)
    worldRoot.position.set(origin.x, origin.y)
    if (mode === 'village') {
      layers.village.scale.set(1)
      layers.village.position.set(0, 0)
    }
  }
  applyCamera()

  app.ticker.add((ticker) => {
    elapsedMs += ticker.deltaMS
    const info: TickInfo = { deltaMs: ticker.deltaMS, elapsedMs }
    for (const handler of handlers) handler(info)
  })

  return {
    app,
    layers,
    assets,
    get camera(): CameraState {
      return camera
    },
    get mode(): RenderMode {
      return mode
    },
    setMode(next) {
      mode = next
      worldRoot.visible = true
      layers.terrain.visible = next !== 'village'
      layers.world.visible = next !== 'village'
      layers.editor.visible = next === 'editor'
      layers.village.visible = next === 'village'
      camera = resizeCamera(
        camera,
        camera.viewportWidth,
        camera.viewportHeight,
        next === 'village' ? 'village' : 'dungeon',
      )
      applyCamera()
    },
    onTick(handler) {
      handlers.add(handler)
      return () => handlers.delete(handler)
    },
    setCamera(next) {
      camera = next
      applyCamera()
    },
    resize(nextWidth, nextHeight) {
      app.renderer.resize(nextWidth, nextHeight)
      camera = resizeCamera(
        camera,
        nextWidth,
        nextHeight,
        mode === 'village' ? 'village' : 'dungeon',
      )
      applyCamera()
    },
    dispose() {
      handlers.clear()
      app.destroy(true, { children: true })
    },
  }
}
