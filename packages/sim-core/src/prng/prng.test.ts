import { describe, expect, it } from 'vitest'
import {
  createRng,
  deriveSeed,
  mix32,
  nextBelow,
  nextRange,
  nextUint32,
} from './index'

describe('Deterministische PRNG', () => {
  it('liefert für denselben Seed dieselbe Folge', () => {
    const first = createRng(12345)
    const second = createRng(12345)
    const firstRun = [nextUint32(first), nextUint32(first), nextUint32(first)]
    const secondRun = [
      nextUint32(second),
      nextUint32(second),
      nextUint32(second),
    ]
    expect(firstRun).toEqual(secondRun)
  })

  it('liefert für andere Seeds eine andere Folge', () => {
    const first = createRng(1)
    const second = createRng(2)
    expect(nextUint32(first)).not.toBe(nextUint32(second))
  })

  it('hält nextBelow und nextRange in den Grenzen', () => {
    const rng = createRng(7)
    expect(nextBelow(rng, 1)).toBe(0)
    for (let index = 0; index < 32; index += 1) {
      const value = nextBelow(rng, 6)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(6)
    }
    const ranged = nextRange(createRng(9), 2, 5)
    expect(ranged).toBeGreaterThanOrEqual(2)
    expect(ranged).toBeLessThanOrEqual(5)
  })

  it('hält den Zustand als Additionszähler', () => {
    // Die Eigenschaft, die eine Rückkopplung des gemischten Wertes zerstört:
    // nach n Zügen steht im Zustand genau `seed + n · K`. Solange das gilt,
    // lässt sich ein Lauf an einem Tick fortsetzen und prüfen, ohne ihn zu
    // wiederholen.
    const rng = createRng(42)
    for (let n = 1; n <= 8; n += 1) {
      nextUint32(rng)
      expect(rng.state).toBe((42 + n * 0x6d2b79f5) >>> 0)
    }
  })

  it('liefert den publizierten mulberry32-Vektor', () => {
    // Referenzwerte der veröffentlichten Fassung für Seed 42. Sie halten die
    // Implementierung an ihrem Namen; Eigenschaftstests allein haben die
    // Abweichung nicht gefangen, weil Determinismus und Grenzen beide hielten.
    const rng = createRng(42)
    const draws = [0, 1, 2, 3, 4].map(() => nextUint32(rng))
    expect(draws).toEqual([
      2581720956, 1925393290, 3661312704, 2876485805, 750819978,
    ])
  })

  it('leitet Seeds stabil und indexabhängig ab', () => {
    expect(deriveSeed(42, 1)).toBe(deriveSeed(42, 1))
    expect(deriveSeed(42, 1)).not.toBe(deriveSeed(42, 2))
    expect(deriveSeed(42, 1, 5)).not.toBe(deriveSeed(42, 1, 6))
    const mixed = mix32(0xffffffff)
    expect(Number.isInteger(mixed)).toBe(true)
    expect(mixed).toBeGreaterThanOrEqual(0)
    expect(mixed).toBeLessThanOrEqual(0xffffffff)
  })
})
