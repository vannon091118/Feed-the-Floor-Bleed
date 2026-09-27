import type { WindowState } from './store'

/**
 * Zug-Geometrie der Kontextfenster.
 *
 * `window.tsx` hält die DOM-Verdrahtung, hier steht die Rechnung: wo der Zeiger
 * ein Fenster hinwirft und welcher Teil davon sichtbar bleiben muss. Die
 * Ablage beim Öffnen (`place()` im Store) bleibt unberührt — hier geht es nur
 * um die Bewegung.
 */

export interface DragOrigin {
  pointerX: number
  pointerY: number
}

export interface HeadBox {
  x: number
  y: number
  width: number
}

/** Was vom Klemmen zurückkommt: genau die Position, die gepatcht wird. */
export interface HeadPosition {
  x: number
  y: number
}

export interface VisibleArea {
  width: number
  height: number
}

/**
 * Höhe des Fensterkopfs.
 *
 * Entspricht `.game-window__bar` (40 px in `styles/windows.css`). Sie steht
 * hier, weil die Klemmung die Höhe kennen muss, um die Unterkante zu begrenzen;
 * ändert sich die Leiste, ändert sich dieser Wert.
 */
export const HEAD_HEIGHT = 40

/**
 * Sichtbare Fläche des Fenstersystems.
 *
 * Die App ist viewportgroß (`height: 100dvh`, `body` ohne Scroll), deshalb
 * entspricht das Dokument der Fläche, in der die Fensterkoordinaten liegen.
 */
export function visibleArea(source: EventTarget | null): VisibleArea {
  const doc = (source as Element | null)?.ownerDocument?.documentElement
  return { width: doc?.clientWidth ?? 0, height: doc?.clientHeight ?? 0 }
}

/**
 * Klemmt den Fensterkopf in die sichtbare Fläche.
 *
 * Der Kopf trägt Titel, Fokus-Rahmen und Schließen-Knopf; solange er vollständig
 * im Sichtfeld liegt, bleibt das Fenster bedienbar und lässt sich zurückholen.
 * Der Rumpf darf darüber hinausgezogen werden — über die Kopfleiste hinweg oder
 * an den unteren Rand; das ist Absicht, das Fenster ist eine Kartenfläche, kein
 * Dialog. Ein Fenster, das breiter oder höher ist als die Fläche, wird an der
 * Oberkante verankert, weil es keine bessere Wahl gibt.
 */
export function clampHead(box: HeadBox, area: VisibleArea): HeadPosition {
  const maxX = Math.max(0, area.width - box.width)
  const maxY = Math.max(0, area.height - HEAD_HEIGHT)
  return {
    x: Math.min(Math.max(box.x, 0), maxX),
    y: Math.min(Math.max(box.y, 0), maxY),
  }
}

/**
 * Beginnt eine Ziehbewegung auf einem Bedienelement, ist es kein Zug.
 *
 * Die Fensterleiste nimmt beim `pointerdown` den Zeiger per `setPointerCapture`
 * an; danach gehen auch die Folgeereignisse einschließlich des `click` an die
 * Leiste statt an das Knopf. Ohne diese Grenze wäre der Schließen-Knopf des
 * Fensters tot und nur der Tab in der Topbar würde schließen.
 */
export function isHeadControl(target: EventTarget | null): boolean {
  return Boolean((target as Element | null)?.closest?.('button'))
}

/** Position, die der Zeiger für dieses Fenster anstrebte. */
export function draggedHead(
  event: PointerEvent,
  origin: DragOrigin,
  win: WindowState,
): HeadPosition {
  return clampHead(
    {
      x: event.clientX - origin.pointerX,
      y: event.clientY - origin.pointerY,
      width: win.width,
    },
    visibleArea(event.currentTarget),
  )
}
