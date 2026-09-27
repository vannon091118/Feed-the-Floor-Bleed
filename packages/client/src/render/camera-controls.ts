import {
  type CameraState,
  type CameraWorld,
  panCamera,
  zoomCamera,
} from './camera'
import { bindCameraKeys } from './camera-keys'

interface Point {
  x: number
  y: number
}

const PAN_SLOP = 4

/**
 * Weltkamera-Steuerung; DOM-Overlays bleiben scrollbar und Fenster draggable.
 *
 * Zeiger und Tastatur liegen auf derselben Fläche: der Canvas füllt sie, und
 * eine Taste braucht ohnehin ein fokussierbares Element. Ein Zug auf einem
 * Fenster erreicht die Fläche nicht, weil die Fensterschicht darüber liegt.
 */
export function bindCameraControls(
  surface: HTMLElement,
  world: CameraWorld,
  getCamera: () => CameraState,
  setCamera: (camera: CameraState) => void,
): () => void {
  let previous: Point | null = null

  const pointOf = (event: PointerEvent): Point => ({
    x: event.clientX,
    y: event.clientY,
  })
  const down = (event: PointerEvent): void => {
    if (event.button === 0) previous = pointOf(event)
  }
  const move = (event: PointerEvent): void => {
    if (!previous || event.buttons === 0) return
    const next = pointOf(event)
    const dx = previous.x - next.x
    const dy = previous.y - next.y
    if (Math.hypot(dx, dy) >= PAN_SLOP) {
      setCamera(panCamera(getCamera(), dx, dy, world))
      previous = next
    }
  }
  const up = (): void => {
    previous = null
  }
  const wheel = (event: WheelEvent): void => {
    event.preventDefault()
    setCamera(zoomCamera(getCamera(), event.deltaY < 0 ? 1.1 : 0.9, world))
  }

  surface.addEventListener('pointerdown', down)
  surface.addEventListener('pointermove', move)
  surface.addEventListener('pointerup', up)
  surface.addEventListener('pointercancel', up)
  surface.addEventListener('wheel', wheel, { passive: false })
  const unbindKeys = bindCameraKeys(surface, world, getCamera, setCamera)
  return () => {
    unbindKeys()
    surface.removeEventListener('pointerdown', down)
    surface.removeEventListener('pointermove', move)
    surface.removeEventListener('pointerup', up)
    surface.removeEventListener('pointercancel', up)
    surface.removeEventListener('wheel', wheel)
  }
}
