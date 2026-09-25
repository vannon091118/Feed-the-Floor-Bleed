import { describe, expect, it } from 'vitest'
import {
  FIXED_SCALE,
  absInt,
  clampInt,
  divFixed,
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
