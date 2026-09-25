import { describe, expect, it } from 'vitest'
import { hashFinish, hashStart, hashText, hashToHex, hashWords } from './index'

describe('Deterministischer Hash', () => {
  it('startet mit dem FNV-Offset-Basiswert', () => {
    expect(hashToHex(hashFinish(hashStart()))).toBe('811c9dc5')
  })

  it('ist stabil und sensitiv für Text', () => {
    const first = hashText(hashStart(), 'feed the floor')
    const second = hashText(hashStart(), 'feed the floor')
    const changed = hashText(hashStart(), 'feed the floors')
    expect(first).toBe(second)
    expect(first).not.toBe(changed)
  })

  it('bindet die Wortreihenfolge ein', () => {
    expect(hashWords(hashStart(), [1, 2])).not.toBe(
      hashWords(hashStart(), [2, 1]),
    )
  })

  it('liefert immer acht Hex-Stellen', () => {
    expect(hashFinish(hashStart())).toBeGreaterThanOrEqual(0)
    expect(hashToHex(hashStart())).toMatch(/^[0-9a-f]{8}$/)
    expect(hashToHex(hashText(hashStart(), 'boss'))).toMatch(/^[0-9a-f]{8}$/)
  })
})
