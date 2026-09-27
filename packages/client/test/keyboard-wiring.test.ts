import type { VNode } from 'preact'
import { afterEach, describe, expect, it } from 'vitest'
import { createCamera, panCamera } from '../src/render/camera'
import {
  bindCameraKeys,
  CAMERA_KEY_HINT,
  CAMERA_PAN_STEP,
} from '../src/render/camera-keys'
import { LegendPanel } from '../src/ui/panels'
import { MOVE_STEP, WINDOW_KEY_HINT, windowKeyProps } from '../src/window/keys'
import {
  focusedId,
  openWindow,
  resetWindows,
  type WindowState,
  windows,
} from '../src/window/store'

/**
 * Die Verdrahtung der Tastaturpfade an echte DOM-Ereignisse.
 *
 * Rahmen und Rumpf sind zwei Fokuspunkte; ohne die Grenze in `windowKeyProps`
 * zöge jede Pfeiltaste in der Trail-Liste das Fenster statt der Liste. In der
 * Schubladenanordnung führt das Layout die Geometrie, dort bewegt dieselbe Taste
 * gar nichts. Die Rechnung selbst prüft `keyboard-access.test.ts`.
 */
describe('Fensterrahmen und Weltansicht verdrahtet', () => {
  afterEach(() => {
    resetWindows()
  })

  const flaeche = { width: 1000, height: 800 }
  const rahmen = {
    ownerDocument: {
      documentElement: {
        clientWidth: flaeche.width,
        clientHeight: flaeche.height,
      },
    },
  } as unknown as EventTarget
  const schmal = {
    ownerDocument: {
      documentElement: { clientWidth: 644, clientHeight: 651 },
    },
  } as unknown as EventTarget

  /** Öffnet das Phasenfenster in der Ausgangslage des Stores. */
  function opened(): WindowState {
    openWindow({ id: 'phase', title: 'Aktion' })
    return windows.value[0] as WindowState
  }

  /** Stellt einen Pfeiltastendruck und meldet `preventDefault`. */
  function pressKey(
    win: WindowState,
    frame: EventTarget,
    target: EventTarget,
  ): boolean {
    let prevented = false
    windowKeyProps(win).onKeyDown({
      key: 'ArrowRight',
      shiftKey: false,
      target,
      currentTarget: frame,
      preventDefault: () => {
        prevented = true
      },
    } as unknown as KeyboardEvent)
    return prevented
  }

  it('verschiebt das Fenster, wenn der Rahmen selbst das Ziel ist', () => {
    const win = opened()
    expect(pressKey(win, rahmen, rahmen)).toBe(true)
    expect(windows.value[0]?.x).toBe(win.x + MOVE_STEP)
    expect(windows.value[0]?.y).toBe(win.y)
    expect(focusedId.value).toBe('phase')
  })

  it('lässt das Fenster stehen, wenn die Taste aus dem Inhalt kommt', () => {
    const win = opened()
    expect(pressKey(win, rahmen, {} as EventTarget)).toBe(false)
    expect(windows.value[0]).toEqual(win)
  })

  it('bewegt in der Schubladenanordnung nichts', () => {
    const win = opened()
    expect(pressKey(win, schmal, schmal)).toBe(false)
    expect(windows.value[0]).toEqual(win)
  })

  it('bindet den Kameraschritt an die Fläche und löst ihn wieder', () => {
    let camera = createCamera(1200, 800)
    const listeners = new Map<string, (event: KeyboardEvent) => void>()
    const surface = {
      addEventListener: (type: string, fn: (event: KeyboardEvent) => void) => {
        listeners.set(type, fn)
      },
      removeEventListener: (type: string) => {
        listeners.delete(type)
      },
    } as unknown as HTMLElement
    const unbind = bindCameraKeys(
      surface,
      'village',
      () => camera,
      (next) => {
        camera = next
      },
    )

    /** Was die Fläche zugestellt bekommt, geht hier weiter. */
    function zustellen(key: string): boolean {
      let prevented = false
      for (const listener of listeners.values())
        listener({
          key,
          preventDefault: () => {
            prevented = true
          },
        } as unknown as KeyboardEvent)
      return prevented
    }

    // Genau ein Empfänger für `keydown`, und er sitzt an der Fläche.
    expect([...listeners.keys()]).toEqual(['keydown'])
    expect(zustellen('ArrowDown')).toBe(true)
    expect(camera).toEqual(
      panCamera(createCamera(1200, 800), 0, CAMERA_PAN_STEP, 'village'),
    )
    expect(zustellen('a')).toBe(false)

    unbind()
    expect(listeners.size).toBe(0)
    const vorher = { ...camera }
    expect(zustellen('ArrowRight')).toBe(false)
    expect(camera).toEqual(vorher)
  })
})

describe('Steuerungslegende', () => {
  it('nennt die Tasten beider Bedienorte', () => {
    const tree = LegendPanel() as VNode<{
      children: VNode<{ children: string }>[]
    }>
    const lines = tree.props.children.map((entry) => entry.props.children)
    expect(lines).toContain(CAMERA_KEY_HINT)
    expect(lines).toContain(WINDOW_KEY_HINT)
  })
})
