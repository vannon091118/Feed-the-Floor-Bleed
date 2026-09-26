import { describe, expect, it } from 'vitest'
import {
  bob,
  periodicWave,
  squash,
  stepLift,
  walkSway,
} from '../src/render/animation'

describe('Render-Animation', () => {
  it('ist für Uhrzeit und Seed deterministisch und periodisch', () => {
    const sample = periodicWave(321.5, 1200, 4.25)
    expect(periodicWave(321.5, 1200, 4.25)).toBe(sample)
    expect(periodicWave(1521.5, 1200, 4.25)).toBeCloseTo(sample, 12)
    expect(periodicWave(-878.5, 1200, 4.25)).toBeCloseTo(sample, 12)
  })

  it('bleibt begrenzt und läuft glatt über die Periodengrenzen', () => {
    const period = 900
    for (let tick = 0; tick < period; tick += 3) {
      expect(periodicWave(tick, period, 1.75)).toBeGreaterThanOrEqual(-1)
      expect(periodicWave(tick, period, 1.75)).toBeLessThanOrEqual(1)
    }
    const before = periodicWave(period - 0.01, period, 0)
    const at = periodicWave(period, period, 0)
    const after = periodicWave(period + 0.01, period, 0)
    expect(at).toBeCloseTo(-1, 12)
    expect(Math.abs(at - before)).toBeLessThan(1e-8)
    expect(Math.abs(after - at)).toBeLessThan(1e-8)
  })

  it('hält Bob, Schritt, Squash und Schwanken in ihren Amplituden', () => {
    for (let clock = 0; clock < 5000; clock += 17) {
      expect(Math.abs(bob(clock, 2))).toBeLessThanOrEqual(1.5)
      expect(stepLift(clock, 2)).toBeGreaterThanOrEqual(0)
      expect(stepLift(clock, 2)).toBeLessThanOrEqual(3)
      expect(Math.abs(walkSway(clock, 2))).toBeLessThanOrEqual(0.12)
      const shape = squash(clock, 2)
      expect(shape.x).toBeGreaterThanOrEqual(0.95)
      expect(shape.x).toBeLessThanOrEqual(1.05)
      expect(shape.y).toBeGreaterThanOrEqual(0.95)
      expect(shape.y).toBeLessThanOrEqual(1.05)
    }
  })
})
