import { WORLD_SIZE_PX, type WorldPoint } from '../world'

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

/**
 * Die einzige World↔Screen-Transformation des Clients.
 *
 * Renderer, Pointer-Hit-Test und Drag benutzen genau diese zwei Funktionen.
 * Eine zweite Umrechnung irgendwo sonst wäre ein sofortiger Divergenzfehler.
 */
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

function clampAxis(value: number, halfSpan: number): number {
  const min = halfSpan
  const max = WORLD_SIZE_PX - halfSpan
  if (max <= min) return WORLD_SIZE_PX / 2
  if (value < min) return min
  if (value > max) return max
  return value
}

/** Hält die Kamera im Weltrechteck; kleinere Welten rasten auf die Mitte. */
export function clampCamera(camera: CameraState): CameraState {
  const halfWidth = camera.viewportWidth / (2 * camera.zoom)
  const halfHeight = camera.viewportHeight / (2 * camera.zoom)
  return {
    ...camera,
    x: clampAxis(camera.x, halfWidth),
    y: clampAxis(camera.y, halfHeight),
  }
}

export function resizeCamera(
  camera: CameraState,
  viewportWidth: number,
  viewportHeight: number,
): CameraState {
  return clampCamera({ ...camera, viewportWidth, viewportHeight })
}

export function panCamera(
  camera: CameraState,
  dx: number,
  dy: number,
): CameraState {
  return clampCamera({
    ...camera,
    x: camera.x + dx / camera.zoom,
    y: camera.y + dy / camera.zoom,
  })
}

export function centerCameraOn(
  camera: CameraState,
  target: WorldPoint,
): CameraState {
  return clampCamera({ ...camera, x: target.x, y: target.y })
}

export function zoomCamera(camera: CameraState, factor: number): CameraState {
  const zoom = Math.min(4, Math.max(0.5, camera.zoom * factor))
  return clampCamera({ ...camera, zoom })
}
