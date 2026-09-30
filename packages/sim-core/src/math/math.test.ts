import { describe, expect, it } from 'vitest'
import { absInt, clampInt, FIXED_SCALE, mulFixed, toFixed } from './index'

describe('Fixed-Point-Mathe', () => {
  it('skaliert und rechnet ganzzahlig', () => {
    expect(FIXED_SCALE).toBe(1000)
    expect(toFixed(3, 250)).toBe(3250)
    expect(mulFixed(toFixed(3), toFixed(4))).toBe(toFixed(12))
  })

  it('rechnet unterhalb der Mantissengrenze exakt, darüber nicht mehr', () => {
    // Ganzzahlig exakt bis weit über die Spielgrößen hinaus.
    expect(mulFixed(2 ** 27, 2 ** 27)).toBe(18014398509481)
    expect(mulFixed(toFixed(200), toFixed(1000))).toBe(toFixed(200_000))
    // Jenseits der Mantissengrenze ist die Multiplikation nicht mehr exakt.
    expect(mulFixed(9007199254740994, 1001)).not.toBe(9016206453995734)
  })

  it('klemmt und normalisiert Ganzzahlen', () => {
    expect(clampInt(-5, 0, 10)).toBe(0)
    expect(clampInt(5, 0, 10)).toBe(5)
    expect(clampInt(50, 0, 10)).toBe(10)
    expect(absInt(-7)).toBe(7)
    expect(absInt(7)).toBe(7)
  })
})
