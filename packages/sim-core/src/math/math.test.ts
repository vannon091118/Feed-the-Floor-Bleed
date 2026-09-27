import { describe, expect, it } from 'vitest'
import {
  absInt,
  clampInt,
  divFixed,
  FIXED_SCALE,
  isqrt,
  mulFixed,
  sqrtFixed,
  toFixed,
} from './index'

describe('Fixed-Point-Mathe', () => {
  it('skaliert und rechnet ganzzahlig', () => {
    expect(FIXED_SCALE).toBe(1000)
    expect(toFixed(3, 250)).toBe(3250)
    expect(mulFixed(toFixed(3), toFixed(4))).toBe(toFixed(12))
    expect(divFixed(toFixed(12), toFixed(4))).toBe(toFixed(3))
  })

  it('wirft bei Division durch null', () => {
    expect(() => divFixed(toFixed(1), 0)).toThrow()
  })

  it('rechnet unterhalb der Mantissengrenze exakt, darüber nicht mehr', () => {
    // Ganzzahlig exakt bis weit über die Spielgrößen hinaus.
    expect(mulFixed(2 ** 27, 2 ** 27)).toBe(18014398509481)
    expect(mulFixed(toFixed(200), toFixed(1000))).toBe(toFixed(200_000))
    // Jenseits der Mantissengrenze ist die Multiplikation nicht mehr exakt.
    expect(mulFixed(9007199254740994, 1001)).not.toBe(9016206453995734)
  })

  it('teilt unterhalb der Mantissengrenze exakt, darüber nicht mehr', () => {
    // Der Zähler `left * FIXED_SCALE` bleibt bis |left| = 2^53 / FIXED_SCALE
    // exakt; darunter ist auch die Trunkierung auf die Ganzzahl richtig, und
    // zwar in beiden Vorzeichen, weil zur Null hin trunkiert wird.
    const LIMIT = Math.floor(2 ** 53 / FIXED_SCALE)
    expect(divFixed(LIMIT, 7)).toBe(1286742750677142)
    expect(divFixed(-LIMIT, 7)).toBe(-1286742750677142)
    expect(divFixed(toFixed(200_000), toFixed(3))).toBe(66666666)
    // Exakt wäre 8_998_201_053_687_306 — dieser Zähler liegt über der Grenze.
    expect(divFixed(9_007_199_254_740_994, 1001)).not.toBe(8998201053687306)
  })

  it('klemmt und normalisiert Ganzzahlen', () => {
    expect(clampInt(-5, 0, 10)).toBe(0)
    expect(clampInt(5, 0, 10)).toBe(5)
    expect(clampInt(50, 0, 10)).toBe(10)
    expect(absInt(-7)).toBe(7)
    expect(absInt(7)).toBe(7)
  })

  it('zieht ganzzahlige Wurzeln ohne Float', () => {
    expect(isqrt(0)).toBe(0)
    expect(isqrt(144)).toBe(12)
    expect(isqrt(145)).toBe(12)
    expect(isqrt(1_000_000)).toBe(1000)
    expect(sqrtFixed(9000)).toBe(3000)
  })
})
