import type { D1Database, D1Result } from './d1'
import { RaidStoreError } from './errors'
import {
  type RequestedRaidJobStatus,
  assertTransitionPayload,
  canTransitionRaidJob,
} from './job-state'
import { commitRaid } from './raid-commit'
import {
  EXPIRE_ATTACKER_OPEN_JOBS,
  EXPIRE_JOB,
  UPDATE_JOB_STATUS,
  readJob,
} from './raid-queries'
import type {
  CommitRaidInput,
  CommitRaidResult,
  RaidJobRecord,
} from './raid-records'
import { assertId, assertNow } from './raid-records'

export class D1RaidStore {
  constructor(private readonly db: D1Database) {}

  commit(input: CommitRaidInput): Promise<CommitRaidResult> {
    return commitRaid(this.db, input)
  }

  async transition(
    id: string,
    target: RequestedRaidJobStatus,
    now: number,
    data: { resultJson?: string; failureCode?: string } = {},
  ): Promise<RaidJobRecord> {
    assertId(id, 'id')
    assertNow(now)
    const resultJson = data.resultJson ?? null
    const failureCode = data.failureCode ?? null
    assertTransitionPayload(target, resultJson, failureCode)
    const current = await this.requireJob(id)
    if (current.expiresAt <= now) {
      await this.expireJob(id, now)
      throw new RaidStoreError('INVALID_TRANSITION', `Job ${id} ist abgelaufen`)
    }
    let changed: D1Result
    // Der Übergangsgraph gehört `@floor/contracts`; der SQLite-Trigger bleibt
    // nur die Datenbank-Sperre. So ist der Fehler vor dem Schreibzugriff klar.
    if (!canTransitionRaidJob(current.status, target))
      throw new RaidStoreError(
        'INVALID_TRANSITION',
        `Übergang ${current.status} → ${target} ist nicht erlaubt`,
      )
    try {
      changed = await this.db
        .prepare(UPDATE_JOB_STATUS)
        .bind(target, now, resultJson, failureCode, id, current.status, now)
        .run()
    } catch (error) {
      if (
        error instanceof Error &&
        /invalid job status transition/.test(error.message)
      )
        throw new RaidStoreError(
          'INVALID_TRANSITION',
          `Übergang ${current.status} → ${target} ist nicht erlaubt`,
        )
      throw error
    }
    if (changed.meta.changes !== 1)
      throw new RaidStoreError(
        'INVALID_TRANSITION',
        `Job ${id} wurde parallel geändert`,
      )
    return this.requireJob(id)
  }

  async expireJob(id: string, now: number): Promise<boolean> {
    assertId(id, 'id')
    assertNow(now)
    const result = await this.db.prepare(EXPIRE_JOB).bind(now, id, now).run()
    return result.meta.changes === 1
  }

  async expireOpenJobs(attackerId: string, now: number): Promise<void> {
    assertId(attackerId, 'attackerId')
    assertNow(now)
    await this.db
      .prepare(EXPIRE_ATTACKER_OPEN_JOBS)
      .bind(now, attackerId, now)
      .run()
  }

  getJob(id: string): Promise<RaidJobRecord | null> {
    return readJob(this.db, id)
  }

  private async requireJob(id: string): Promise<RaidJobRecord> {
    const job = await this.getJob(id)
    if (!job)
      throw new RaidStoreError('JOB_NOT_FOUND', `Job ${id} existiert nicht`)
    return job
  }
}
