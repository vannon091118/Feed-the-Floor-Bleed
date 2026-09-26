import { describe, expect, it } from 'vitest'
import { CONTRACT_VERSION, RaidSnapshotSchema } from '../src'
import { raidSnapshot, versions } from './raid-fixtures'

describe('Kanonischer Raid-Snapshot', () => {
  it('enthält genau die bestätigten Freeze-Daten', () => {
    const snapshot = raidSnapshot()
    expect(RaidSnapshotSchema.safeParse(snapshot).success).toBe(true)
    expect(snapshot.resources).toEqual({ gold: 120, materials: 7 })
    expect(snapshot.monsterSlots).toHaveLength(5)
    expect(snapshot.activeTeam[0]).toEqual({
      heroId: 'hero-1',
      temporaryFatigue: 2,
      temporaryInjury: 0,
    })
  })

  it('verlangt alle kanonischen Bestandteile', () => {
    const snapshot = raidSnapshot()
    for (const field of [
      'resources',
      'monsterSlots',
      'activeTeam',
      'dungeon',
    ] as const) {
      const invalid = { ...snapshot, [field]: undefined }
      expect(RaidSnapshotSchema.safeParse(invalid).success).toBe(false)
    }
  })

  it('erzwingt fünf Slots und höchstens fünf aktive Helden ohne weitere Regeln', () => {
    const snapshot = raidSnapshot()
    expect(
      RaidSnapshotSchema.safeParse({
        ...snapshot,
        monsterSlots: snapshot.monsterSlots.slice(0, 4),
      }).success,
    ).toBe(false)
    expect(
      RaidSnapshotSchema.safeParse({
        ...snapshot,
        activeTeam: Array.from({ length: 6 }, (_, index) => ({
          heroId: `hero-${index}`,
          temporaryFatigue: 0,
          temporaryInjury: 0,
        })),
      }).success,
    ).toBe(false)
  })

  it('gehört ausschließlich zu Contract v3', () => {
    const snapshot = raidSnapshot()
    expect(versions.contractVersion).toBe(CONTRACT_VERSION)
    expect(
      RaidSnapshotSchema.safeParse({ ...snapshot, contractVersion: 1 }).success,
    ).toBe(false)
    expect(
      RaidSnapshotSchema.safeParse({ ...snapshot, tactics: [] }).success,
    ).toBe(false)
  })
})
