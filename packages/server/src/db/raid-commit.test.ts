import { describe, expect, it } from 'vitest'
import { setup, upload } from '../../test/raid-fixtures'
import { RAID_JOB_TTL_MS } from './index'

describe('D1-Raid-Commit', () => {
  it('committet Snapshot und Job atomar und ist idempotent', async () => {
    const { db, store } = setup()
    const input = {
      idempotencyKey: 'job-1',
      attackerId: 'player-1',
      now: 100,
      upload: upload(),
    }
    const first = await store.commit(input)
    const repeated = await store.commit(input)
    expect(first.idempotent).toBe(false)
    expect(repeated.idempotent).toBe(true)
    expect(repeated.job.expiresAt).toBe(100 + RAID_JOB_TTL_MS)
    expect(repeated.job.targetSnapshotId).toBeNull()
    expect(repeated.snapshot).toMatchObject({
      resources: input.upload.resources,
      monsterSlots: input.upload.monsterSlots,
      activeTeam: input.upload.activeTeam,
      dungeon: input.upload.dungeon,
    })
    expect('tactics' in repeated.snapshot).toBe(false)
    expect(db.batchCalls).toBe(2)
    await expect(
      store.commit({
        ...input,
        upload: {
          ...input.upload,
          activeTeam: [
            { heroId: 'other', temporaryFatigue: 0, temporaryInjury: 0 },
          ],
        },
      }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' })
  })

  it('rollt den gesamten Batch bei einem offenen-Slot-Konflikt zurück', async () => {
    const { db, store } = setup()
    const first = await store.commit({
      idempotencyKey: 'job-1',
      attackerId: 'player-1',
      now: 100,
      upload: upload(),
    })
    await expect(
      store.commit({
        idempotencyKey: 'job-2',
        attackerId: 'player-1',
        now: 101,
        upload: upload(),
      }),
    ).rejects.toMatchObject({ code: 'OPEN_JOB_CONFLICT' })
    expect(db.hasSnapshot('job-2')).toBe(false)
    const deadline = 100 + RAID_JOB_TTL_MS
    await expect(
      store.commit({
        idempotencyKey: 'job-2',
        attackerId: 'player-1',
        now: deadline + 1,
        upload: upload(),
      }),
    ).resolves.toMatchObject({ idempotent: false })
    expect(await store.getJob(first.job.id)).toMatchObject({
      status: 'expired',
    })
  })

  it('validiert den Upload-Contract vor jedem D1-Zugriff', async () => {
    const { db, store } = setup()
    const invalid = upload()
    invalid.dungeon.cells.pop()
    await expect(
      store.commit({
        idempotencyKey: 'job-1',
        attackerId: 'player-1',
        now: 100,
        upload: invalid,
      }),
    ).rejects.toThrow()
    expect(db.batchCalls).toBe(0)
  })
})
