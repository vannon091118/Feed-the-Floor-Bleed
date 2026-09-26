import { describe, expect, it } from 'vitest'
import {
  canTransitionRaidJob,
  isTerminalRaidJob,
  RAID_JOB_STATUSES,
  RAID_JOB_TRANSITIONS,
  RaidJobSchema,
} from '../src'
import {
  acceptedJob,
  completedJob,
  expiredJob,
  failedJob,
  result,
  versions,
} from './raid-fixtures'

describe('Raid-Job als strikte Union', () => {
  it('akzeptiert jeden dokumentierten Zustand', () => {
    for (const job of [
      acceptedJob(),
      completedJob(),
      failedJob(),
      expiredJob(),
    ])
      expect(RaidJobSchema.safeParse(job).success).toBe(true)
    expect(RaidJobSchema.safeParse(acceptedJob()).success).toBe(true)
  })

  it('übersteht einen JSON-Roundtrip verlustfrei', () => {
    for (const job of [completedJob(), failedJob(), expiredJob()]) {
      const parsed = RaidJobSchema.parse(job)
      const roundTrip = JSON.parse(JSON.stringify(parsed))
      expect(roundTrip).toEqual(parsed)
      expect(RaidJobSchema.safeParse(roundTrip).success).toBe(true)
    }
  })

  it('trennt Ergebnis, Fehler und Timeout strukturell', () => {
    const completed = completedJob()
    const failed = failedJob()
    const expired = expiredJob()
    const carry = (job: object, extra: object) => ({ ...job, ...extra })
    expect(
      RaidJobSchema.safeParse(carry(completed, { error: failed.error }))
        .success,
    ).toBe(false)
    expect(
      RaidJobSchema.safeParse(carry(failed, { result: result() })).success,
    ).toBe(false)
    expect(
      RaidJobSchema.safeParse(carry(failed, { status: 'queued' })).success,
    ).toBe(false)
    expect(
      RaidJobSchema.safeParse(carry(acceptedJob(), { result: result() }))
        .success,
    ).toBe(false)
    expect(
      RaidJobSchema.safeParse(carry(failed, { error: expired.error })).success,
    ).toBe(false)
    expect(
      RaidJobSchema.safeParse(carry(expired, { error: failed.error })).success,
    ).toBe(false)
  })

  it('kennt genau die sechs Zustände und einen gerichteten Automaten', () => {
    expect(RAID_JOB_STATUSES).toHaveLength(6)
    expect(Object.keys(RAID_JOB_TRANSITIONS)).toHaveLength(6)
    expect(canTransitionRaidJob('accepted', 'running')).toBe(false)
    expect(canTransitionRaidJob('accepted', 'queued')).toBe(true)
    expect(canTransitionRaidJob('running', 'completed')).toBe(true)
    expect(canTransitionRaidJob('completed', 'failed')).toBe(false)
    expect(canTransitionRaidJob('expired', 'running')).toBe(false)
    for (const status of ['completed', 'failed', 'expired'] as const)
      expect(isTerminalRaidJob(status)).toBe(true)
    for (const status of ['accepted', 'queued', 'running'] as const)
      expect(isTerminalRaidJob(status)).toBe(false)
  })

  it('verlangt den Timeout-Code nur bei abgelaufener Frist', () => {
    expect(
      RaidJobSchema.safeParse({
        ...expiredJob(),
        error: { ...versions, code: 'protected' },
      }).success,
    ).toBe(false)
    expect(
      RaidJobSchema.safeParse({
        ...failedJob(),
        error: { ...versions, code: 'timeout' },
      }).success,
    ).toBe(false)
  })
})
