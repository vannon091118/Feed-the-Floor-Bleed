import { describe, expect, it } from 'vitest'
import { indexOf, neighbors, pointOf } from './grid'
import { GRID_SIZE } from './types'

/**
 * Pinnt die Nachbarschaft, weil die Route daran hängt.
 *
 * Die Ordnung rechts, unten, links, oben ist kein Zufall: `path.ts` bricht
 * Gleichstand in der Breitensuche über sie, und `path.test.ts` vergleicht nur
 * einen Lauf mit sich selbst. Wer die Ordnung tauscht, ändert die Route,
 * ohne dass ein bestehender Test fällt.
 */
describe('Nachbarschaft im Raster', () => {
  it('liefert rechts, unten, links, oben in dieser Reihenfolge', () => {
    const zelle = indexOf({ x: 20, y: 20 })
    expect(neighbors(zelle)).toEqual([
      zelle + 1,
      zelle + GRID_SIZE,
      zelle - 1,
      zelle - GRID_SIZE,
    ])
  })

  it('lässt den Rand ausfallen statt umzubrechen', () => {
    // Die Ecke hat zwei Nachbarn, die Kante drei. Ein Umbruch würde die
    // Zeile weiterführen und eine Zelle aus der nächsten Zeile als Nachbarn
    // melden — genau der Fehler, den die Funktion ausschließen soll.
    const ecke = indexOf({ x: 0, y: 0 })
    expect(neighbors(ecke)).toEqual([ecke + 1, ecke + GRID_SIZE])

    const kante = indexOf({ x: 0, y: 5 })
    expect(neighbors(kante)).toEqual([
      kante + 1,
      kante + GRID_SIZE,
      kante - GRID_SIZE,
    ])

    const rechts = indexOf({ x: GRID_SIZE - 1, y: 5 })
    expect(neighbors(rechts)).toEqual([
      rechts + GRID_SIZE,
      rechts - 1,
      rechts - GRID_SIZE,
    ])
  })

  it('rechnet Zellnummer und Punkt gegeneinander zurück', () => {
    for (const p of [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: GRID_SIZE - 1, y: GRID_SIZE - 1 },
    ]) {
      expect(pointOf(indexOf(p))).toEqual(p)
    }
  })
})
