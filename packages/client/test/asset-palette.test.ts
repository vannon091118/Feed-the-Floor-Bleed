import { describe, expect, it } from 'vitest'
import {
  createRng,
  GLINT,
  mix,
  nextBelow,
  PALETTE,
  saturate,
  shift,
} from '../tools/palette.mjs'
import { PixelBuffer } from '../tools/pixel-buffer.mjs'
import { encodePng } from '../tools/png.mjs'

/**
 * Pinned die Farbwerkzeuge des Generators.
 *
 * Der Grund ist ein gemessener Fehler: `shift` nahm einen `value`-Parameter
 * entgegen und verwendete ihn nicht. Jede Abschattung im Zeichner — die
 * Fassade auf 78 Prozent, der Fuß des Wandblocks — war damit wirkungslos, und
 * die Wand kam als schwarze Fläche heraus. Ein Werkzeug, das eine Zahl annimmt
 * und sie verschluckt, ist kein stiller Fehler, sondern ein Loch.
 */

describe('shift', () => {
  it('senkt die Helligkeit, wenn value unter 1 liegt', () => {
    const base = 0x6b6f76
    expect(shift(base, { value: 0.5 })).not.toBe(base)
    expect(shift(base, { value: 0.5 })).toBeLessThan(base)
  })

  it('hebt die Helligkeit, wenn value über 1 liegt', () => {
    const base = 0x6b6f76
    expect(shift(base, { value: 1.2 })).toBeGreaterThan(base)
  })

  it('lässt die Farbe bei value 1 unverändert', () => {
    expect(shift(0x6b6f76, { value: 1 })).toBe(0x6b6f76)
  })

  it('läuft bei value 1 nicht über Weiß hinaus', () => {
    // Vor dem Fehler sprang `value: 1.05` auf `0xf3f4f4` und brach die
    // Deckplatte aus. Die Aufhellung darf wirken, aber nicht ausbrennen.
    const deck = shift(
      mix(saturate(PALETTE.stone.base, 0.82), 0xffffff, 0.16),
      {
        value: 1.05,
      },
    )
    expect(deck & 0xff).toBeGreaterThan(0xf0)
  })

  it('behält die Helligkeitsstufe, wenn value wirkt', () => {
    // Die eigentliche Zusicherung: value ist kein toter Parameter.
    const steps = [0.6, 0.8, 1.0].map((value) => shift(0x6b6f76, { value }))
    expect(new Set(steps).size).toBe(3)
  })

  it('verschiebt den Farbton bei hue, ohne value zu verlieren', () => {
    const shifted = shift(0x6b6f76, { hue: 120, value: 0.8 })
    expect(shifted).not.toBe(shift(0x6b6f76, { value: 0.8 }))
  })
})

describe('saturate und mix', () => {
  it('entsättigt eine Farbe Richtung Graustufe', () => {
    // Bei `amount: 0` bleibt die Luminanz übrig, nicht ein fester Grauton:
    // Rot landet bei 76, Grün bei 149. Genau das ist der Unterschied zwischen
    // entsättigen und verwischen.
    expect(saturate(0xff0000, 0)).toBe(0x4c4c4c)
    const saturated = saturate(0xff0000, 1)
    expect(saturated).toBe(0xff0000)
  })

  it('zieht eine Farbe bei amount 0 auf ihre Luminanz', () => {
    const channelsOf = (color: number) => [
      (color >>> 16) & 0xff,
      (color >>> 8) & 0xff,
      color & 0xff,
    ]
    expect(channelsOf(saturate(0x3366ff, 0))[0]).toBe(
      channelsOf(saturate(0x3366ff, 0))[1],
    )
  })

  it('mischt zwei Farben im Verhältnis des Gewichts', () => {
    expect(mix(0x000000, 0xffffff, 1)).toBe(0x000000)
    expect(mix(0x000000, 0xffffff, 0)).toBe(0xffffff)
  })
})

describe('PRNG des Generators', () => {
  it('liefert für denselben Seed dieselbe Folge', () => {
    const a = createRng(42)
    const b = createRng(42)
    const first = Array.from({ length: 8 }, () => a())
    const second = Array.from({ length: 8 }, () => b())
    expect(first).toEqual(second)
  })

  it('liefert Werte unter 1', () => {
    const rng = createRng(7)
    for (let index = 0; index < 64; index += 1) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('liefert nextBelow nur unterhalb der Schranke', () => {
    const rng = createRng(11)
    for (let index = 0; index < 64; index += 1) {
      const value = nextBelow(rng, 5)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(5)
    }
  })
})

describe('PixelBuffer', () => {
  it('setzt volle Deckung, wenn kein Alpha angegeben ist', () => {
    const buffer = new PixelBuffer(4, 4)
    buffer.px(1, 1, 0x336699)
    const offset = (1 * 4 + 1) * 4
    expect(buffer.data[offset + 3]).toBe(255)
  })

  it('lässt ein Pixel bei Alpha 0 unberührt', () => {
    const buffer = new PixelBuffer(4, 4)
    buffer.px(1, 1, 0x336699, 0)
    expect(buffer.data[(1 * 4 + 1) * 4 + 3]).toBe(0)
  })

  it('füllt ein Rechteck vollständig', () => {
    const buffer = new PixelBuffer(8, 8)
    buffer.fill(2, 2, 4, 4, 0xffffff)
    for (let y = 2; y < 6; y += 1) {
      for (let x = 2; x < 6; x += 1) {
        expect(buffer.data[(y * 8 + x) * 4 + 3]).toBe(255)
      }
    }
    expect(buffer.data[(1 * 8 + 1) * 4 + 3]).toBe(0)
  })

  it('schneidet Kacheln am Pufferrand ab, statt zu schreiben', () => {
    const buffer = new PixelBuffer(4, 4)
    buffer.px(-1, 0, 0xffffff)
    buffer.px(0, 99, 0xffffff)
    expect(buffer.data.some((value) => value === 255)).toBe(false)
  })
})

describe('PNG-Encoder', () => {
  it('schreibt Signatur, IHDR und IEND', () => {
    const buffer = new PixelBuffer(2, 2)
    buffer.fill(0, 0, 2, 2, 0x804020)
    const png = encodePng(2, 2, buffer.data)
    expect([...png.subarray(0, 8)]).toEqual([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ])
    const text = png.toString('latin1')
    expect(text).toContain('IHDR')
    expect(text).toContain('IDAT')
    expect(text).toContain('IEND')
  })

  it('liefert bei gleichen Eingaben bytegleiche Ausgaben', () => {
    const build = () => {
      const buffer = new PixelBuffer(4, 4)
      buffer.fill(0, 0, 4, 4, GLINT)
      return encodePng(4, 4, buffer.data)
    }
    expect(build().equals(build())).toBe(true)
  })
})
