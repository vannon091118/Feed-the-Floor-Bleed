import { arrowDirection } from '../input/arrows'
import {
  type CameraState,
  type CameraWorld,
  panCamera,
  ZOOM_STEP_IN,
  ZOOM_STEP_OUT,
  zoomCamera,
} from './camera'

/** Wie weit eine Pfeiltaste den Blick schiebt, in Bildschirmpixeln. */
export const CAMERA_PAN_STEP = 48

/** Beschreibt die Tasten der Weltansicht; die Steuerungslegende zeigt sie. */
export const CAMERA_KEY_HINT =
  'Weltansicht: Pfeiltasten schwenken den Blick, Plus und Minus zoomen'

/**
 * Was eine Taste mit der Kamera macht.
 *
 * Rein rechnend: die Richtung kommt aus `input/arrows`, die Verdrahtung steht
 * in `bindCameraKeys`. Die Schrittweite gilt vor dem Zoom, `panCamera` teilt sie
 * durch ihn hindurch — eine Taste schiebt den Blick damit in jeder Zoomstufe
 * gleich weit über den Bildschirm. `null` heißt: die Taste gehört nicht zur
 * Kamera.
 */
export function cameraAfterKey(
  camera: CameraState,
  key: string,
  world: CameraWorld,
): CameraState | null {
  const direction = arrowDirection(key)
  if (direction)
    return panCamera(
      camera,
      direction.dx * CAMERA_PAN_STEP,
      direction.dy * CAMERA_PAN_STEP,
      world,
    )
  if (key === '+' || key === '=') return zoomCamera(camera, ZOOM_STEP_IN, world)
  if (key === '-' || key === '_')
    return zoomCamera(camera, ZOOM_STEP_OUT, world)
  return null
}

/**
 * Props, die die Weltansicht zum Tastaturziel machen.
 *
 * Sie gehören demselben Owner wie der Tastenschritt: `application` sagt der
 * Vorlesehilfe, dass die Fläche die Pfeiltasten selbst verbraucht, und ohne
 * Fokus käme kein `keydown` an. Der Host setzt sie mit `aria-label` zusammen.
 */
export function cameraSurfaceProps(): {
  role: 'application'
  tabIndex: number
} {
  return { role: 'application', tabIndex: 0 }
}

/**
 * Bindet den Tastenschritt an die Fläche der Weltansicht.
 *
 * Die Fläche muss selbst fokussierbar und benannt sein — ohne Fokus erreicht
 * kein `keydown` sie. Das leistet der Host in `ui/world-host.tsx`; die Rückgabe
 * löst die Bindung wieder.
 */
export function bindCameraKeys(
  surface: HTMLElement,
  world: CameraWorld,
  getCamera: () => CameraState,
  setCamera: (camera: CameraState) => void,
): () => void {
  const onKey = (event: KeyboardEvent): void => {
    const next = cameraAfterKey(getCamera(), event.key, world)
    if (!next) return
    event.preventDefault()
    setCamera(next)
  }
  surface.addEventListener('keydown', onKey)
  return () => surface.removeEventListener('keydown', onKey)
}
