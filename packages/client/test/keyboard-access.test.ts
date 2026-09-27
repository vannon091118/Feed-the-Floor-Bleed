import { describe, expect, it } from 'vitest'
import { arrowDirection } from '../src/input/arrows'
import { createCamera, panCamera, zoomCamera } from '../src/render/camera'
import { CAMERA_PAN_STEP, cameraAfterKey } from '../src/render/camera-keys'
import {
  MIN_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
  type VisibleArea,
} from '../src/window/drag'
import { boxAfterKey, MOVE_STEP, RESIZE_STEP } from '../src/window/keys'
import type { WindowState } from '../src/window/store'

/**
 * Der Tastenschritt aus T2.1, rein rechnend.
 *
 * Schrittweiten, Klemmen und Mindestgrößen sind die Stellen, an denen ein
 * stiller Fehler nicht auffällt: eine Taste, die das Fenster aus dem Sichtfeld
 * schiebt oder unter die Mindestgröße schrumpft, sähe im Browser wie eine
 * kaputte Oberfläche aus, ohne dass ein Gate etwas merkt. Die Verdrahtung an
 * echte DOM-Ereignisse prüft `keyboard-wiring.test.ts`.
 */
const AREA: VisibleArea = { width: 1000, height: 800 }

/** Fenster in fester Ausgangslage; `over` ersetzt einzelne Werte. */
function win(over: Partial<WindowState> = {}): WindowState {
  return {
    id: 'phase',
    title: 'Aktion',
    x: 100,
    y: 100,
    width: 300,
    height: 300,
    z: 10,
    ...over,
  }
}

describe('Fensterrahmen per Taste', () => {
  it('verschiebt den Kopf um die Schrittweite und klemmt ihn in die Fläche', () => {
    expect(boxAfterKey(win(), 'ArrowRight', false, AREA)).toEqual({
      x: 100 + MOVE_STEP,
      y: 100,
    })
    expect(boxAfterKey(win(), 'ArrowUp', false, AREA)).toEqual({
      x: 100,
      y: 100 - MOVE_STEP,
    })
    expect(boxAfterKey(win({ x: 0 }), 'ArrowLeft', false, AREA)).toEqual({
      x: 0,
      y: 100,
    })
    expect(boxAfterKey(win({ y: 0 }), 'ArrowUp', false, AREA)).toEqual({
      x: 100,
      y: 0,
    })
    // Ein Fenster am rechten Rand wandert auf die Kante, nicht darüber hinaus.
    expect(boxAfterKey(win({ x: 900 }), 'ArrowRight', false, AREA)).toEqual({
      x: AREA.width - 300,
      y: 100,
    })
  })

  it('skaliert mit Umschalt und hält beide Mindestgrößen', () => {
    expect(boxAfterKey(win(), 'ArrowRight', true, AREA)).toEqual({
      width: 300 + RESIZE_STEP,
    })
    expect(
      boxAfterKey(win({ width: MIN_WINDOW_WIDTH }), 'ArrowLeft', true, AREA),
    ).toEqual({ width: MIN_WINDOW_WIDTH })
    expect(
      boxAfterKey(win({ height: MIN_WINDOW_HEIGHT }), 'ArrowUp', true, AREA),
    ).toEqual({ height: MIN_WINDOW_HEIGHT })
  })

  it('lässt fremde Tasten unberührt', () => {
    for (const key of ['a', 'Enter', 'Tab', ' ']) {
      expect(boxAfterKey(win(), key, false, AREA)).toBeNull()
      expect(boxAfterKey(win(), key, true, AREA)).toBeNull()
    }
  })
})

describe('Weltansicht per Taste', () => {
  const camera = createCamera(1200, 800)

  it('schiebt den Blick um die Schrittweite', () => {
    expect(cameraAfterKey(camera, 'ArrowRight', 'village')).toEqual(
      panCamera(camera, CAMERA_PAN_STEP, 0, 'village'),
    )
    expect(cameraAfterKey(camera, 'ArrowUp', 'dungeon')).toEqual(
      panCamera(camera, 0, -CAMERA_PAN_STEP, 'dungeon'),
    )
  })

  it('zoomt mit Plus und Minus, auch mit getippter Zweitbelegung', () => {
    expect(cameraAfterKey(camera, '+', 'village')).toEqual(
      zoomCamera(camera, 1.1, 'village'),
    )
    expect(cameraAfterKey(camera, '=', 'village')).toEqual(
      zoomCamera(camera, 1.1, 'village'),
    )
    expect(cameraAfterKey(camera, '-', 'village')).toEqual(
      zoomCamera(camera, 0.9, 'village'),
    )
    // Oberhalb der größten Stufe bleibt der Zoom stehen.
    expect(cameraAfterKey({ ...camera, zoom: 4 }, '+', 'village')?.zoom).toBe(4)
  })

  it('lässt fremde Tasten unberührt', () => {
    expect(cameraAfterKey(camera, 'Tab', 'village')).toBeNull()
    expect(cameraAfterKey(camera, 'ArrowRight', 'village')?.x).not.toBe(
      camera.x + CAMERA_PAN_STEP,
    )
  })
})

/**
 * Eine Abbildung für beide Pfade.
 *
 * Fensterrahmen und Weltansicht fragen dieselbe Tabelle aus `input/arrows`; sie
 * stand vorher zweimal im Repo, mit je vier Ternären. Die beiden Describe-Blöcke
 * darüber sind die Gegenprobe, dass beide dieselbe Richtung bekommen.
 */
describe('Pfeiltasten-Abbildung', () => {
  it('kennt die vier Richtungen und sonst nichts', () => {
    expect(
      ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].map(arrowDirection),
    ).toEqual([
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ])
    for (const key of ['a', 'Tab', '+', 'Enter', ' '])
      expect(arrowDirection(key)).toBeNull()
  })
})
