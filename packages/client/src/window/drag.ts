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

/** Ausgangsgröße eines Skalierzugs: die Fensterbox plus der Zeigerstand. */
export type ResizeOrigin = DragOrigin & { width: number; height: number }

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
 * Kleinstmögliche Fensterhöhe, nach unten wie beim Resize-Griff.
 *
 * `window.tsx` klemmt den Resize auf 120; der Fit darf nicht darunter liegen,
 * sonst würde das Anpassen an einen kurzen Inhalt das Fenster schrumpfen lassen,
 * wo der Griff es nicht schrumpfen lässt.
 */
export const MIN_WINDOW_HEIGHT = 120

/**
 * Kleinste Fensterbreite, nach unten wie beim Resize-Griff.
 *
 * Der Tastaturschritt in `keys.ts` klemmt mit demselben Wert; er steht hier,
 * weil `resizedBox` ihn schon führt.
 */
export const MIN_WINDOW_WIDTH = 180

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
 * Breite, bis zu der ein Fenster eine Schublade ist.
 *
 * Darunter pinnt `windows.css` `left`, `top` und `width` mit `!important` an die
 * untere Kante: die Karte soll auf schmalen Anzeigen bedienbar bleiben, statt als
 * freie Fläche über den Rand zu laufen. Diese Anordnung ist dort die alleinige
 * Autorität über die Geometrie — Bewegung und Größe gehören dann nicht dem
 * Nutzer. Ohne diese Grenze schriebe die Tastatur weiter in den Store, während
 * das Bild stünde, und beides liefe still auseinander.
 *
 * Die Zahl steht auch in `windows.css` an der Medienabfrage — CSS liest keine
 * TypeScript-Konstanten; der Test vergleicht beide Seiten.
 */
export const SHEET_MAX_WIDTH = 720

/** Führt die Schubladenanordnung die Geometrie, statt sie dem Nutzer zu lassen? */
export function sheetOwnsLayout(area: VisibleArea): boolean {
  return area.width <= SHEET_MAX_WIDTH
}

/**
 * Darf der Nutzer dieses Fenster gerade bewegen und skalieren?
 *
 * Zeiger und Tastatur fragen dieselbe Grenze ab: in der Schublade beginnt keine
 * Geste und kein Tastenschritt, damit der Store nicht von dem abweicht, was zu
 * sehen ist.
 */
export function geometryIsUserOwned(event: Event): boolean {
  return !sheetOwnsLayout(visibleArea(event.currentTarget))
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

/**
 * Nimmt den Zeiger für die Dauer einer Geste an.
 *
 * Ohne die Annahme reißt die Bewegung ab, sobald der Zeiger die Leiste schnell
 * verlässt; die Folgeereignisse gingen dann an das Element darunter.
 */
export function capturePointer(event: PointerEvent): void {
  const target = event.currentTarget as HTMLElement | null
  target?.setPointerCapture?.(event.pointerId)
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

/**
 * Höhe, die ein Fenster braucht, um seinen Inhalt ganz zu zeigen.
 *
 * Rein rechnend: Kopf plus Inhaltsfläche, geklemmt auf die Mindesthöhe des
 * Resize-Griffs und den Platz zwischen `top` und der Falz. `top` ist die
 * Fensteroberkante; ohne sie wüchse ein Fenster unterhalb des oberen Randes
 * über die Falz hinaus und der untere Teil wäre nicht mehr im Sichtfeld —
 * dann scrollt der Inhalt lieber im Fenster. Der Falz bleibt die Grenze, der
 * Kopf liegt nie unter ihr.
 */
export function fittedHeight(
  contentHeight: number,
  area: VisibleArea,
  top = 0,
): number {
  const wanted = Math.max(0, contentHeight) + HEAD_HEIGHT
  return Math.max(MIN_WINDOW_HEIGHT, Math.min(wanted, area.height - top))
}

/**
 * Größe, die der Resize-Griff aus einem Zeigerstand macht.
 *
 * Denselben Klemmen wie der Fit: der Griff darf nicht unter die Mindesthöhe,
 * die Breite nicht unter die Mindestbreite des Rumpfs.
 */
export function resizedBox(
  origin: DragOrigin & { width: number; height: number },
  event: PointerEvent,
): { width: number; height: number } {
  return {
    width: Math.max(
      MIN_WINDOW_WIDTH,
      origin.width + event.clientX - origin.pointerX,
    ),
    height: Math.max(
      MIN_WINDOW_HEIGHT,
      origin.height + event.clientY - origin.pointerY,
    ),
  }
}
