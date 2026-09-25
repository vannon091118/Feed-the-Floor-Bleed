import { describe, expect, it } from 'vitest'
import { shouldRun } from '../lib/engine-policy.mjs'
import { POLICY } from '../policy.mjs'

describe('engine policy matching', () => {
  it('runs every always-gate for an unrelated file', () => {
    const changed = ['docs/change.md']
    for (const name of POLICY.engine.always) {
      expect(shouldRun(name, changed, false, POLICY)).toBe(true)
    }
  })

  it('skips both core slices for an unrelated file', () => {
    expect(
      shouldRun('core-determinism', ['docs/change.md'], false, POLICY),
    ).toBe(false)
    expect(shouldRun('false-positive', ['docs/change.md'], false, POLICY)).toBe(
      false,
    )
  })

  it('matches prefix and contains slices', () => {
    expect(
      shouldRun(
        'core-determinism',
        ['packages/sim-core/src/math/index.ts'],
        false,
        POLICY,
      ),
    ).toBe(true)
    expect(
      shouldRun(
        'false-positive',
        ['packages/sim-core/src/combat/index.ts'],
        false,
        POLICY,
      ),
    ).toBe(true)
    expect(
      shouldRun(
        'false-positive',
        ['packages/sim-core/src/math/index.ts'],
        false,
        POLICY,
      ),
    ).toBe(false)
  })

  it('runs every configured plugin in full mode', () => {
    for (const name of Object.keys(POLICY.engine.slices)) {
      expect(shouldRun(name, [], true, POLICY)).toBe(true)
    }
  })
})
