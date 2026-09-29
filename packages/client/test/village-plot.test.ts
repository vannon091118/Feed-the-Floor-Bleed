import { describe, expect, it } from 'vitest'
import type { Footprint, GridBounds } from '../src/village/plot'
import {
  canPlace,
  edgeNeighbours,
  expandHorizontally,
  footprintOverlaps,
  footprintWithinBounds,
  rectsIntersect,
} from '../src/village/plot'

const FELD: GridBounds = { columns: 10, rows: 10 }

const RATHHAUS: Footprint = { x: 0, y: 0, width: 2, height: 2 }
const GILDE: Footprint = { x: 4, y: 0, width: 2, height: 1 }
const STARTOKTE = [RATHHAUS, GILDE]

describe('Grundriss und Rastergrenze', () => {
  it('erkennt eine echte Überlappung', () => {
    expect(rectsIntersect(RATHHAUS, { x: 1, y: 1, width: 2, height: 2 })).toBe(
      true,
    )
  })

  it('erkennt Randberührung nicht als Überlappung', () => {
    expect(rectsIntersect(RATHHAUS, { x: 2, y: 0, width: 2, height: 1 })).toBe(
      false,
    )
  })

  it('zählt die Diagonale weder als Überlappung noch als Nachbarschaft', () => {
    const diagonal: Footprint = { x: 2, y: 2, width: 1, height: 1 }
    expect(rectsIntersect(RATHHAUS, diagonal)).toBe(false)
    expect(footprintOverlaps(diagonal, STARTOKTE)).toBe(false)
    expect(edgeNeighbours(diagonal, FELD)).not.toContainEqual(RATHHAUS)
  })

  it('findet einen vorhandenen Grundriss in der belegten Liste', () => {
    expect(
      footprintOverlaps({ x: 4, y: 0, width: 1, height: 1 }, STARTOKTE),
    ).toBe(true)
    expect(
      footprintOverlaps({ x: 7, y: 7, width: 1, height: 1 }, STARTOKTE),
    ).toBe(false)
  })

  it('lässt einen vollständig innenliegenden Grundriss zu', () => {
    expect(
      footprintWithinBounds({ x: 8, y: 8, width: 2, height: 2 }, FELD),
    ).toBe(true)
  })

  it('weist jede Randauslage mit derselben Begründung ab', () => {
    const ausserhalb: Footprint[] = [
      { x: -1, y: 0, width: 1, height: 1 },
      { x: 0, y: -1, width: 1, height: 1 },
      { x: 10, y: 0, width: 1, height: 1 },
      { x: 0, y: 10, width: 1, height: 1 },
      { x: 9, y: 9, width: 2, height: 2 },
    ]
    for (const grundriss of ausserhalb) {
      expect(canPlace(grundriss, STARTOKTE, FELD)).toEqual({
        ok: false,
        reason: 'out-of-bounds',
      })
    }
  })
})

describe('Ein Grundriss besteht aus ganzen Rasterzellen', () => {
  it('weist eine Lage ab, die keine Zelle bezeichnet', () => {
    // `1.5` liegt im Raster, ist aber keine Zelle. Ohne diese Prüfung käme es
    // als gültig durch und stünde hinterher im Dorf.
    for (const x of [1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(canPlace({ x, y: 0, width: 1, height: 1 }, [], FELD)).toEqual({
        ok: false,
        reason: 'not-a-cell',
      })
    }
  })

  it('weist einen Grundriss ohne Ausdehnung ab', () => {
    // Breite 0 überlappt nichts und wäre sonst unbegrenzt oft platzierbar.
    expect(canPlace({ x: 0, y: 0, width: 0, height: 1 }, [], FELD)).toEqual({
      ok: false,
      reason: 'not-a-cell',
    })
    expect(canPlace({ x: 0, y: 0, width: 1, height: -1 }, [], FELD)).toEqual({
      ok: false,
      reason: 'not-a-cell',
    })
  })

  it('nennt bei negativer Lage weiterhin die Rastergrenze', () => {
    expect(canPlace({ x: -1, y: 0, width: 1, height: 1 }, [], FELD)).toEqual({
      ok: false,
      reason: 'out-of-bounds',
    })
  })
})

describe('Die eine Platzierungsentscheidung', () => {
  it('lässt eine freie Lage im Raster zu', () => {
    expect(
      canPlace({ x: 6, y: 5, width: 2, height: 2 }, STARTOKTE, FELD),
    ).toEqual({ ok: true })
  })

  it('nennt beim Überlappen den konkurrierenden Grundriss', () => {
    const ergebnis = canPlace(
      { x: 1, y: 0, width: 2, height: 1 },
      STARTOKTE,
      FELD,
    )
    expect(ergebnis).toEqual({
      ok: false,
      reason: 'overlaps',
      conflict: RATHHAUS,
    })
  })

  it('meldet die Rastergrenze vor der Überlappung', () => {
    // Dieselbe Lage wäre doppelt zu beanstanden; genannt wird der erste Grund.
    const ergebnis = canPlace(
      { x: 4, y: 10, width: 1, height: 1 },
      STARTOKTE,
      FELD,
    )
    expect(ergebnis.ok).toBe(false)
    expect(ergebnis.ok === false && ergebnis.reason).toBe('out-of-bounds')
  })

  it('lässt aneinanderstoßende Grundrisse nebeneinander zu', () => {
    expect(canPlace(GILDE, [RATHHAUS], FELD)).toEqual({ ok: true })
  })
})

describe('Kantennachbarschaft', () => {
  it('liefert oben, rechts, unten, links in fester Reihenfolge', () => {
    const mitte: Footprint = { x: 4, y: 4, width: 2, height: 2 }
    expect(edgeNeighbours(mitte, FELD)).toEqual([
      { x: 4, y: 3, width: 2, height: 1 },
      { x: 6, y: 4, width: 1, height: 2 },
      { x: 4, y: 6, width: 2, height: 1 },
      { x: 3, y: 4, width: 1, height: 2 },
    ])
  })

  it('überlappt keinen Nachbarn mit dem eigenen Grundriss', () => {
    const gebaeude: Footprint = { x: 4, y: 4, width: 3, height: 2 }
    for (const nachbar of edgeNeighbours(gebaeude, FELD)) {
      expect(rectsIntersect(gebaeude, nachbar)).toBe(false)
      expect(canPlace(nachbar, [gebaeude], FELD)).toEqual({ ok: true })
    }
  })

  it('lässt Nachbarn am Rand weg, statt sie außerhalb zu melden', () => {
    expect(edgeNeighbours({ x: 0, y: 0, width: 1, height: 1 }, FELD)).toEqual([
      { x: 1, y: 0, width: 1, height: 1 },
      { x: 0, y: 1, width: 1, height: 1 },
    ])
  })

  it('zählt vier Nachbarn nur bei voller Nachbarschaft', () => {
    const voll = edgeNeighbours({ x: 4, y: 4, width: 1, height: 1 }, FELD)
    const ecke = edgeNeighbours({ x: 0, y: 0, width: 1, height: 1 }, FELD)
    expect(voll).toHaveLength(4)
    expect(ecke.length).toBeLessThan(voll.length)
  })
})

describe('Horizontale Landerweiterung', () => {
  it('ersetzt nur die Spaltenzahl und lässt die Höhe stehen', () => {
    expect(expandHorizontally(10, 10, 16)).toEqual({ columns: 16, rows: 10 })
  })

  it('behält die Höhe auch bei einer anderen Rasterhöhe', () => {
    expect(expandHorizontally(10, 7, 12).rows).toBe(7)
  })

  it('weist eine Verkleinerung ab', () => {
    expect(() => expandHorizontally(10, 10, 8)).toThrow()
  })
})

describe('Keine impliziten Standardwerte', () => {
  it('verlangt für jede Prüfung Raster und Belegung ausdrücklich', () => {
    // Kein Aufruf ohne Parameter: das Raster ist Argument, nicht Konstante.
    const eng: GridBounds = { columns: 3, rows: 3 }
    const randlage: Footprint = { x: 3, y: 3, width: 1, height: 1 }
    expect(canPlace(randlage, [], eng)).toEqual({
      ok: false,
      reason: 'out-of-bounds',
    })
    expect(canPlace(randlage, [], FELD)).toEqual({ ok: true })
  })

  it('liefert bei gleichen Eingaben immer dasselbe Ergebnis', () => {
    const kandidat: Footprint = { x: 3, y: 3, width: 2, height: 2 }
    const erster = canPlace(kandidat, STARTOKTE, FELD)
    const nachbarn = edgeNeighbours(kandidat, FELD)
    for (let wiederholung = 0; wiederholung < 5; wiederholung++) {
      expect(canPlace(kandidat, STARTOKTE, FELD)).toEqual(erster)
      expect(edgeNeighbours(kandidat, FELD)).toEqual(nachbarn)
    }
    expect(erster).toEqual({ ok: true })
  })

  it('verändert die übergebene Belegung nicht', () => {
    const belegung: Footprint[] = [{ x: 5, y: 5, width: 1, height: 1 }]
    canPlace({ x: 5, y: 5, width: 1, height: 1 }, belegung, FELD)
    expect(belegung).toEqual([{ x: 5, y: 5, width: 1, height: 1 }])
  })
})
