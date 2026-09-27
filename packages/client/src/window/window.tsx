import type { ComponentChildren } from 'preact'
import { useRef } from 'preact/hooks'
import * as drag from './drag'
import { useWindowFit } from './fit'
import { windowKeyProps } from './keys'
import {
  closeWindow,
  focusWindow,
  patchWindow,
  type WindowState,
} from './store'
export interface GameWindowProps {
  win: WindowState
  focused: boolean
  /** Wechselt der Inhalt, ohne dass die ID wechselt: siehe `contentSignature`. */
  contentKey: string
  children: ComponentChildren
}
/**
 * Ein Kontextfenster: eine verschiebbare, fokussierbare Ansicht über der Welt.
 * Der Inhaltsbereich hängt an `contentKey`, damit ein Phasenfenster, das seine
 * ID über die Schleife behält, trotzdem den Inhalt wechseln kann.
 *
 * Den Zeigerdruck auf Kopf, Griff und Rumpf fängt der Rahmen selbst ab: beides
 * steigt bis hierher auf, also holt ein Klick das Fenster nach vorn, egal auf
 * welchem Teil er landet. Die Tastatur steht daneben in `windowKeyProps`.
 */
export function GameWindow({
  win,
  focused,
  contentKey,
  children,
}: GameWindowProps) {
  const move = useRef<drag.DragOrigin | null>(null)
  const resize = useRef<drag.ResizeOrigin | null>(null)

  // In der Schubladenanordnung führt das Layout die Geometrie; dort beginnt
  // keine Geste, sonst schriebe der Store gegen das Bild.
  const startMove = (event: PointerEvent): void => {
    if (drag.isHeadControl(event.target)) return
    if (!drag.geometryIsUserOwned(event)) return
    move.current = {
      pointerX: event.clientX - win.x,
      pointerY: event.clientY - win.y,
    }
    drag.capturePointer(event)
  }
  const doMove = (event: PointerEvent): void => {
    const origin = move.current
    if (!origin) return
    const head = drag.draggedHead(event, origin, win)
    patchWindow(win.id, { x: head.x, y: head.y })
  }
  const endDrag = (): void => {
    move.current = null
    resize.current = null
  }

  const startResize = (event: PointerEvent): void => {
    if (!drag.geometryIsUserOwned(event)) return
    resize.current = {
      ...win,
      pointerX: event.clientX,
      pointerY: event.clientY,
    }
    drag.capturePointer(event)
  }
  const doResize = (event: PointerEvent): void => {
    const origin = resize.current
    if (!origin) return
    patchWindow(win.id, drag.resizedBox(origin, event))
  }

  const measureBody = useWindowFit(win)
  const keys = windowKeyProps(win)
  return (
    <section
      {...keys}
      class={focused ? 'game-window is-focused' : 'game-window'}
      aria-labelledby={`window-title-${win.id.replaceAll(':', '-')}`}
      style={{
        left: `${win.x}px`,
        top: `${win.y}px`,
        width: `${win.width}px`,
        height: `${win.height}px`,
        zIndex: String(win.z),
      }}
      onPointerDown={() => focusWindow(win.id)}
    >
      <header
        class="game-window__bar"
        onPointerDown={startMove}
        onPointerMove={doMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span
          class="game-window__title"
          id={`window-title-${win.id.replaceAll(':', '-')}`}
        >
          {win.title}
        </span>
        <button
          type="button"
          class="game-window__close"
          aria-label="Fenster schließen"
          onClick={() => closeWindow(win.id)}
        >
          ×
        </button>
      </header>
      {/* Eigener Fokuspunkt: nur so erreichen die Pfeiltasten den Inhalt und
          scrollen ihn, statt das Fenster zu verschieben. */}
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Der Rumpf scrollt; ein scrollender Bereich muss mit der Tastatur erreichbar sein, und die Regel sieht `overflow` nicht. */}
      <div class="game-window__body" key={contentKey} tabIndex={0}>
        <div class="game-window__content" ref={measureBody}>
          {children}
        </div>
      </div>
      <span
        class="game-window__resize"
        onPointerDown={startResize}
        onPointerMove={doResize}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
    </section>
  )
}
