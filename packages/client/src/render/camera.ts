import { WORLD_SIZE_PX, type WorldPoint } from '../world'
import { VILLAGE_WORLD_HEIGHT, VILLAGE_WORLD_WIDTH } from './village-layout'

export interface CameraState {
  /** Weltkoordinate, die aktuell in der Viewport-Mitte liegt. */
  x: number
  y: number
  zoom: number
  viewportWidth: number
  viewportHeight: number
}

export interface ScreenPoint {
  x: number
  y: number
}

export type CameraWorld = 'dungeon' | 'village'

function worldSize(world: CameraWorld): { width: number; height: number } {
  return world === 'village'
    ? { width: VILLAGE_WORLD_WIDTH, height: VILLAGE_WORLD_HEIGHT }
    : { width: WORLD_SIZE_PX, height: WORLD_SIZE_PX }
}

/** Einzige World↔Screen-Transformation für beide Welten. */
export function worldToScreen(
  camera: CameraState,
  world: WorldPoint,
): ScreenPoint {
  return {
    x: (world.x - camera.x) * camera.zoom + camera.viewportWidth / 2,
    y: (world.y - camera.y) * camera.zoom + camera.viewportHeight / 2,
  }
}

export function screenToWorld(
  camera: CameraState,
  screen: ScreenPoint,
): WorldPoint {
  return {
    x: (screen.x - camera.viewportWidth / 2) / camera.zoom + camera.x,
    y: (screen.y - camera.viewportHeight / 2) / camera.zoom + camera.y,
  }
}

export function createCamera(
  viewportWidth: number,
  viewportHeight: number,
): CameraState {
  return {
    x: WORLD_SIZE_PX / 2,
    y: WORLD_SIZE_PX / 2,
    zoom: 1,
    viewportWidth,
    viewportHeight,
  }
}

function clampAxis(value: number, halfSpan: number, extent: number): number {
  const min = halfSpan
  const max = extent - halfSpan
  if (max <= min) return extent / 2
  if (value < min) return min
  if (value > max) return max
  return value
}

/** Hält Kamera im gewählten Weltrechteck; die Geometrie bleibt unverändert. */
export function clampCamera(
  camera: CameraState,
  world: CameraWorld = 'dungeon',
): CameraState {
  const size = worldSize(world)
  return {
    ...camera,
    x: clampAxis(
      camera.x,
      camera.viewportWidth / (2 * camera.zoom),
      size.width,
    ),
    y: clampAxis(
      camera.y,
      camera.viewportHeight / (2 * camera.zoom),
      size.height,
    ),
  }
}

export function resizeCamera(
  camera: CameraState,
  viewportWidth: number,
  viewportHeight: number,
  world: CameraWorld = 'dungeon',
): CameraState {
  return clampCamera({ ...camera, viewportWidth, viewportHeight }, world)
}

export function panCamera(
  camera: CameraState,
  dx: number,
  dy: number,
  world: CameraWorld = 'dungeon',
): CameraState {
  return clampCamera(
    {
      ...camera,
      x: camera.x + dx / camera.zoom,
      y: camera.y + dy / camera.zoom,
    },
    world,
  )
}

export function centerCameraOn(
  camera: CameraState,
  target: WorldPoint,
  world: CameraWorld = 'dungeon',
): CameraState {
  return clampCamera({ ...camera, x: target.x, y: target.y }, world)
}

export function zoomCamera(
  camera: CameraState,
  factor: number,
  world: CameraWorld = 'dungeon',
): CameraState {
  const zoom = Math.min(4, Math.max(0.5, camera.zoom * factor))
  return clampCamera({ ...camera, zoom }, world)
}

/** Zentriert das Weltrechteck im Viewport; Owner der Rahmung ist die Szene. */
export function fitCamera(
  camera: CameraState,
  world: CameraWorld,
  maxZoom = 1.5,
): CameraState {
  const size = worldSize(world)
  const zoom = Math.min(
    maxZoom,
    Math.max(
      0.5,
      Math.min(
        camera.viewportWidth / size.width,
        camera.viewportHeight / size.height,
      ),
    ),
  )
  return clampCamera(
    { ...camera, x: size.width / 2, y: size.height / 2, zoom },
    world,
  )
}
