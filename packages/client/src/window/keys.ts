import { arrowDirection } from '../input/arrows'
import {
  clampHead,
  MIN_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
  sheetOwnsLayout,
  type VisibleArea,
  visibleArea,
} from './drag'
import {
  focusWindow,
  patchWindow,
  type WindowPatch,
  type WindowState,
} from './store'

/**
 * Tastaturpfad des Fensters, in zwei Hälften.
 *
 * `boxAfterKey` rechnet rein: die Richtung kommt aus `input/arrows`, das Klemmen
 * aus `drag.ts`. `windowKeyProps` ist die einzige Stelle mit DOM-Zugriff und
 * verdrahtet sie an den Rahmen — samt der Grenze, die dort auch liegt: nur der
 * Rahmen selbst wandert, ein Tastenanschlag aus dem Fensterinhalt gehört dem
 * Inhalt. Der Test pinnt beide Hälften.
 */

/** Schrittweite der Pfeiltasten beim Verschieben. */
export const MOVE_STEP = 16

/** Schrittweite mit Umschalt: das Fenster wächst statt zu wandern. */
export const RESIZE_STEP = 24

/** Beschreibt die Tasten des Fensterrahmens; die Steuerungslegende zeigt sie. */
export const WINDOW_KEY_HINT =
  'Fenster: Pfeiltasten verschieben, Umschalt und Pfeiltasten skalieren'

/**
 * Was eine Pfeiltaste mit einem Fenster macht.
 *
 * Rein rechnend und ohne DOM: die Verdrahtung steht in `windowKeyProps`. Das
 * Klemmen ist dasselbe wie bei Zeiger und Fit — der Kopf bleibt sichtbar, die
 * Mindestgrößen dieselben —, damit Tastatur und Zeiger nicht auseinanderlaufen.
 * `null` heißt: die Taste gehört nicht zu diesem Fenster — in der
 * Schubladenanordnung (schmale Anzeigen) gehört die Geometrie dem Layout, dort
 * gibt es keinen Tastenschritt.
 */
export function boxAfterKey(
  win: WindowState,
  key: string,
  shift: boolean,
  area: VisibleArea,
): WindowPatch | null {
  if (sheetOwnsLayout(area)) return null
  const direction = arrowDirection(key)
  if (!direction) return null
  if (shift) {
    if (direction.dx !== 0)
      return {
        width: Math.max(
          MIN_WINDOW_WIDTH,
          win.width + direction.dx * RESIZE_STEP,
        ),
      }
    return {
      height: Math.max(
        MIN_WINDOW_HEIGHT,
        win.height + direction.dy * RESIZE_STEP,
      ),
    }
  }
  return clampHead(
    {
      x: win.x + direction.dx * MOVE_STEP,
      y: win.y + direction.dy * MOVE_STEP,
      width: win.width,
    },
    area,
  )
}

/**
 * Tastatur-Props des Fensterrahmens.
 *
 * Der Rahmen ist fokussierbar, weil er das Bedienziel ist: ohne Fokus gäbe es
 * keinen Weg, ein Fenster ohne Zeiger zu verschieben. Der erste Tastendruck
 * holt das Fenster zugleich nach vorn, damit der Fokusring des Stores der
 * Tastatur folgt und nicht nur dem Zeiger.
 */
export function windowKeyProps(win: WindowState): {
  tabIndex: number
  onKeyDown: (event: KeyboardEvent) => void
} {
  return {
    tabIndex: 0,
    onKeyDown: (event) => {
      // Nur der Rahmen selbst wandert. Der Rumpf ist ein eigener Fokuspunkt und
      // scrollt mit denselben Tasten; ohne die Grenze zöge jede Pfeiltaste im
      // Inhalt das Fenster statt der Liste.
      if (event.target !== event.currentTarget) return
      const patch = boxAfterKey(
        win,
        event.key,
        event.shiftKey,
        visibleArea(event.currentTarget),
      )
      if (!patch) return
      event.preventDefault()
      focusWindow(win.id)
      patchWindow(win.id, patch)
    },
  }
}
