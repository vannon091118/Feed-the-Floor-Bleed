import { afterEach, describe, expect, it } from 'vitest'
import { fixture } from '../src/fixture-data'
import { villageOutlook } from '../src/village/settlement'
import { resetDayNight } from '../src/village/state'

afterEach(() => {
  resetDayNight()
})

describe('Dorfblick: Ableitung aus dem Phase-Owner', () => {
  it('zeigt den Dorfnamen und spiegelt Tag und Phase', () => {
    const outlook = villageOutlook()
    expect(outlook.name).toBe(fixture.village)
    expect(outlook.day).toBe(fixture.day)
    expect(outlook.phase).toBe('tag')
  })

  it('gibt die Gilde ohne Kopie weiter', () => {
    expect(villageOutlook().roster).toBe(fixture.team)
  })
})
