import { Application, Container } from 'pixi.js'
import { type CameraState, createCamera, resizeCamera } from './camera'
import { LAYER_NAMES, type LayerName, layerZ } from './layers'

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
  readonly camera: CameraState
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

  const layers = buildLayers()
  layers.world.sortableChildren = true
  const worldRoot = new Container()
  worldRoot.sortableChildren = true
  worldRoot.zIndex = 15
  worldRoot.addChild(layers.terrain, layers.world)
  app.stage.sortableChildren = true
  app.stage.addChild(layers.void, worldRoot, layers.overlay)

  const handlers = new Set<TickHandler>()
  let camera = createCamera(width, height)
  let elapsedMs = 0

  const applyCamera = (): void => {
    worldRoot.scale.set(camera.zoom)
    worldRoot.position.set(
      -camera.x * camera.zoom + camera.viewportWidth / 2,
      -camera.y * camera.zoom + camera.viewportHeight / 2,
    )
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
    get camera(): CameraState {
      return camera
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
      camera = resizeCamera(camera, nextWidth, nextHeight)
      applyCamera()
    },
    dispose() {
      handlers.clear()
      app.destroy(true, { children: true })
    },
  }
}
