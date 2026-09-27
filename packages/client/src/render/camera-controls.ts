import {
  type CameraState,
  type CameraWorld,
  panCamera,
  zoomCamera,
} from './camera'

interface Point {
  x: number
  y: number
}

const PAN_SLOP = 4

/** Weltkamera-Steuerung; DOM-Overlays bleiben scrollbar und Fenster draggable. */
export function bindCameraControls(
  canvas: HTMLCanvasElement,
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

  canvas.addEventListener('pointerdown', down)
  canvas.addEventListener('pointermove', move)
  canvas.addEventListener('pointerup', up)
  canvas.addEventListener('pointercancel', up)
  canvas.addEventListener('wheel', wheel, { passive: false })
  return () => {
    canvas.removeEventListener('pointerdown', down)
    canvas.removeEventListener('pointermove', move)
    canvas.removeEventListener('pointerup', up)
    canvas.removeEventListener('pointercancel', up)
    canvas.removeEventListener('wheel', wheel)
  }
}
