import { describe, expect, it } from 'vitest'
import { setup, upload } from '../../test/raid-fixtures'
import { RAID_JOB_TTL_MS } from './index'

async function acceptedJob(now = 100) {
  const context = setup()
  const committed = await context.store.commit({
    idempotencyKey: 'job-1',
    attackerId: 'player-1',
    now,
    upload: upload(),
  })
  return { ...context, job: committed.job }
}

describe('D1-Raid-Zustandsautomat', () => {
  it('führt nur erlaubte Übergänge aus und speichert das Ergebnis', async () => {
    const { store, job } = await acceptedJob()
    await store.transition(job.id, 'queued', 101)
    await store.transition(job.id, 'running', 102)
    const completed = await store.transition(job.id, 'completed', 103, {
      resultJson: '{"outcome":"win"}',
    })
    expect(completed).toMatchObject({
      status: 'completed',
      resultJson: '{"outcome":"win"}',
    })
    await expect(
      store.transition(job.id, 'failed', 104, { failureCode: 'blocked' }),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' })
  })

  it('erlaubt einen Fehler aus der laufenden Phase', async () => {
    const { store, job } = await acceptedJob()
    await store.transition(job.id, 'queued', 101)
    await store.transition(job.id, 'running', 102)
    const failed = await store.transition(job.id, 'failed', 103, {
      failureCode: 'invalid-hash',
    })
    expect(failed).toMatchObject({
      status: 'failed',
      failureCode: 'invalid-hash',
    })
  })

  it('läuft nach 15 Minuten hart ab und blockiert spätere Übergänge', async () => {
    const { store, job } = await acceptedJob()
    await store.transition(job.id, 'queued', 101)
    const deadline = 100 + RAID_JOB_TTL_MS
    await expect(
      store.transition(job.id, 'running', deadline),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' })
    expect(await store.getJob(job.id)).toMatchObject({
      status: 'expired',
      failureCode: 'timeout',
    })
  })
})
