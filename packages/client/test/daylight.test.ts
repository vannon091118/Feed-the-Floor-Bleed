import { describe, expect, it } from 'vitest'
import shellCss from '../src/ui/styles/shell.css?raw'
import { PHASE_ORDER } from '../src/village/phase'
import {
  DAYLIGHT_CLASS,
  DAYLIGHT_FADE_MS,
  DAYLIGHT_LAYER_CLASS,
  daylightActiveIndex,
  daylightFadeStarts,
  daylightLayers,
  daylightTargets,
} from '../src/visual/daylight'

/**
 * Die Tagesstimmung hat zwei Seiten: die Palette kommt aus dem Visual-Owner,
 * den Überzug malt das Stylesheet. Beide müssen zusammenpassen.
 *
 * Der Auslöser ist ein echter Defekt: die Regeln `.app.is-day` und `.app.is-night`
 * verschwanden mit dem alten `styles.css`, während `docs/ROADMAP.md` sie noch als
 * „ungenutzt bereitliegend“ führte. Danach lagen die Farben im Stylesheet statt
 * bei den übrigen Präsentationsdeskriptoren; die Phasen-Union ist die Quelle, der
 * Deskriptor muss ihr folgen.
 *
 * Der weiche Wechsel ist der dritte Teil. Deklariert war `transition: background`,
 * gewirkt hat davon nichts: Chromium interpoliert keinen Gradienten, der Wert
 * springt. Jetzt trägt die Deckkraft der Ebenen den Wechsel. Sie darf aber nicht
 * dem Browser überlassen bleiben: kehrt er eine laufende Blende um, verkürzt er
 * sie, und die Summe der Deckkräfte fiel gemessen auf 0,49 — die Tönung wurde
 * für einen Moment sichtbar dünner. Diese Tests pinnen deshalb die Rechnung, die
 * die Summe auf 1 hält: Ziele im Ruhezustand, komplementäre Startwerte, und die
 * Summe über den ganzen Verlauf einer unterbrochenen Blende.
 *
 * Gelesen wird über `?raw` und nicht über `node:fs`: die Testverzeichnisse
 * liegen im `tsc`-Programm, dem die Node-Typdefinitionen fehlen.
 */
describe('Tagesstimmung', () => {
  it('hat für jede Phase der Schleife eine Ebene', () => {
    const layers = daylightLayers()
    expect(layers.map((layer) => layer.phase)).toEqual(PHASE_ORDER)
    for (const layer of layers) {
      expect(layer.tint).toContain('gradient(')
      expect(layer.tint).toContain('rgba(')
    }
  })

  it('unterscheidet die vier Phasen', () => {
    const tinten = daylightLayers().map((layer) => layer.tint)
    expect(new Set(tinten).size).toBe(PHASE_ORDER.length)
  })

  it('findet zu jeder Phase ihren Platz in der Ebenenreihenfolge', () => {
    for (const [index, phase] of PHASE_ORDER.entries()) {
      expect(daylightActiveIndex(phase)).toBe(index)
    }
  })

  it('lässt im Ruhezustand genau eine Ebene sichtbar', () => {
    for (const index of PHASE_ORDER.map((_, each) => each)) {
      const targets = daylightTargets(index)
      expect(targets[index]).toBe(1)
      expect(targets.filter((value) => value === 1)).toHaveLength(1)
      expect(targets.reduce((sum, value) => sum + value, 0)).toBe(1)
    }
  })

  it('hält die Deckkraftsumme auch beim Wechsel aus einer laufenden Blende', () => {
    // Aus dem Ruhezustand: die alte Ebene startet auf 1, die neue auf 0.
    expect(daylightFadeStarts(daylightTargets(0), 1)).toEqual([1, 0, 0, 0])
    // Aus einer halb gelaufenen Blende: die neue Ebene startet auf dem
    // Komplement, damit unterwegs nichts fehlt.
    const interrupted = daylightFadeStarts([0.2, 0.3, 0, 0], 2)
    expect(interrupted).toEqual([0.2, 0.3, 0.5, 0])
    for (const step of [0, 0.25, 0.5, 0.75, 1]) {
      const sum = interrupted.reduce(
        (total, value, index) =>
          index === 2
            ? total + value + (1 - value) * step
            : total + value * (1 - step),
        0,
      )
      expect(sum).toBeCloseTo(1, 10)
    }
  })

  it('deckelt Ausreißer auf die Deckkraftgrenzen', () => {
    expect(daylightFadeStarts([2, 0, 0, 0], 1)).toEqual([1, 0, 0, 0])
  })

  it('wechselt über die Deckkraft der Ebenen und fängt keinen Klick', () => {
    expect(shellCss).toContain(`.${DAYLIGHT_LAYER_CLASS} {`)
    expect(shellCss).toContain(`transition: opacity ${DAYLIGHT_FADE_MS}ms ease`)
    expect(shellCss).not.toContain('transition: background')
    expect(shellCss).toContain('pointer-events: none')
  })

  it('hängt die Überzugsregeln an den Namen des Visual-Owners', () => {
    expect(shellCss).toContain(`.${DAYLIGHT_CLASS} {`)
  })

  it('hält die Palette aus dem Stylesheet heraus', () => {
    expect(shellCss).not.toContain('gradient(')
  })
})
