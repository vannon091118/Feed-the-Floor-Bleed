import type { ScreenPoint } from '../render/camera'

export interface PointerSample {
  screen: ScreenPoint
  pointerId: number
  buttons: number
  shiftKey: boolean
}

export interface PointerHandlers {
  onDown?(sample: PointerSample): void
  onMove?(sample: PointerSample): void
  onUp?(sample: PointerSample): void
  onCancel?(sample: PointerSample): void
}

function sampleOf(target: HTMLElement, event: PointerEvent): PointerSample {
  const rect = target.getBoundingClientRect()
  return {
    screen: { x: event.clientX - rect.left, y: event.clientY - rect.top },
    pointerId: event.pointerId,
    buttons: event.buttons,
    shiftKey: event.shiftKey,
  }
}

/**
 * Ein einziger Interaktionspfad für Maus und Touch.
 *
 * Bewusst Pointer Events statt getrennter Mouse-/Touch-Handler: Damit teilen
 * Hit-Test, Pan und Drag dieselbe Datenform, und ein Touch verhält sich wie
 * ein Mauszug.
 */
export function bindPointer(
  target: HTMLElement,
  handlers: PointerHandlers,
): () => void {
  const down = (event: PointerEvent): void => {
    target.setPointerCapture?.(event.pointerId)
    handlers.onDown?.(sampleOf(target, event))
  }
  const move = (event: PointerEvent): void => {
    handlers.onMove?.(sampleOf(target, event))
  }
  const up = (event: PointerEvent): void => {
    target.releasePointerCapture?.(event.pointerId)
    handlers.onUp?.(sampleOf(target, event))
  }
  const cancel = (event: PointerEvent): void => {
    handlers.onCancel?.(sampleOf(target, event))
  }
  target.addEventListener('pointerdown', down)
  target.addEventListener('pointermove', move)
  target.addEventListener('pointerup', up)
  target.addEventListener('pointercancel', cancel)
  return () => {
    target.removeEventListener('pointerdown', down)
    target.removeEventListener('pointermove', move)
    target.removeEventListener('pointerup', up)
    target.removeEventListener('pointercancel', cancel)
  }
}
