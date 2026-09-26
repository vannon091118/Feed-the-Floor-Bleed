import type { ComponentChildren } from 'preact'
import { useRef } from 'preact/hooks'
import {
  closeWindow,
  focusWindow,
  patchWindow,
  type WindowState,
} from './store'

export interface GameWindowProps {
  win: WindowState
  focused: boolean
  children: ComponentChildren
}

interface MoveOrigin {
  pointerX: number
  pointerY: number
}

interface ResizeOrigin {
  pointerX: number
  pointerY: number
  width: number
  height: number
}

function capture(event: PointerEvent): void {
  const target = event.currentTarget as HTMLElement | null
  target?.setPointerCapture?.(event.pointerId)
}

/**
 * Ein Kontextfenster. Die Welt bleibt die Navigation; dieses Fenster ist nur
 * eine verschiebbare, fokussierbare Ansicht über ihr.
 */
export function GameWindow({ win, focused, children }: GameWindowProps) {
  const move = useRef<MoveOrigin | null>(null)
  const resize = useRef<ResizeOrigin | null>(null)

  const startMove = (event: PointerEvent): void => {
    focusWindow(win.id)
    move.current = {
      pointerX: event.clientX - win.x,
      pointerY: event.clientY - win.y,
    }
    capture(event)
  }
  const doMove = (event: PointerEvent): void => {
    const origin = move.current
    if (!origin) return
    patchWindow(win.id, {
      x: event.clientX - origin.pointerX,
      y: event.clientY - origin.pointerY,
    })
  }
  const endMove = (): void => {
    move.current = null
  }

  const startResize = (event: PointerEvent): void => {
    focusWindow(win.id)
    resize.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      width: win.width,
      height: win.height,
    }
    capture(event)
  }
  const doResize = (event: PointerEvent): void => {
    const origin = resize.current
    if (!origin) return
    patchWindow(win.id, {
      width: Math.max(180, origin.width + event.clientX - origin.pointerX),
      height: Math.max(120, origin.height + event.clientY - origin.pointerY),
    })
  }
  const endResize = (): void => {
    resize.current = null
  }

  return (
    <section
      class={focused ? 'game-window is-focused' : 'game-window'}
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
        onPointerUp={endMove}
        onPointerCancel={endMove}
      >
        <span class="game-window__title">{win.title}</span>
        <button
          type="button"
          class="game-window__close"
          aria-label="Fenster schließen"
          onClick={() => closeWindow(win.id)}
        >
          ×
        </button>
      </header>
      <div class="game-window__body">{children}</div>
      <span
        class="game-window__resize"
        onPointerDown={startResize}
        onPointerMove={doResize}
        onPointerUp={endResize}
        onPointerCancel={endResize}
      />
    </section>
  )
}
