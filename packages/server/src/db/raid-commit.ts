import { RaidSnapshotSchema, UploadRequestSchema } from '@floor/contracts'
import type { D1Database, D1Result } from './d1'
import { RaidStoreError } from './errors'
import { RAID_JOB_TTL_MS } from './job-state'
import {
  EXPIRE_ATTACKER_OPEN_JOBS,
  INSERT_JOB,
  INSERT_SNAPSHOT,
  readJob,
  readSnapshot,
} from './raid-queries'
import type { CommitRaidInput, CommitRaidResult } from './raid-records'
import { assertId, assertNow } from './raid-records'

export async function commitRaid(
  db: D1Database,
  input: CommitRaidInput,
): Promise<CommitRaidResult> {
  assertId(input.idempotencyKey, 'idempotencyKey')
  assertId(input.attackerId, 'attackerId')
  assertNow(input.now)
  const upload = UploadRequestSchema.parse(input.upload)
  const frozenSnapshot = RaidSnapshotSchema.parse({
    contractVersion: upload.contractVersion,
    simVersion: upload.simVersion,
    resources: upload.resources,
    monsterSlots: upload.monsterSlots,
    activeTeam: upload.activeTeam,
    dungeon: upload.dungeon,
  })
  const payloadJson = JSON.stringify(frozenSnapshot)
  const expiresAt = input.now + RAID_JOB_TTL_MS
  let results: D1Result[]
  try {
    results = await db.batch([
      db
        .prepare(EXPIRE_ATTACKER_OPEN_JOBS)
        .bind(input.now, input.attackerId, input.now),
      db
        .prepare(INSERT_SNAPSHOT)
        .bind(
          input.idempotencyKey,
          input.idempotencyKey,
          upload.simVersion,
          payloadJson,
          input.now,
        ),
      db
        .prepare(INSERT_JOB)
        .bind(
          input.idempotencyKey,
          input.idempotencyKey,
          input.attackerId,
          input.now,
          input.now,
          expiresAt,
          input.idempotencyKey,
          input.idempotencyKey,
          upload.simVersion,
          payloadJson,
        ),
    ])
  } catch (error) {
    if (error instanceof Error && /raid_jobs\.attacker_id/.test(error.message))
      throw new RaidStoreError(
        'OPEN_JOB_CONFLICT',
        'Für diesen Angreifer existiert bereits ein offener Raid-Job',
      )
    throw new RaidStoreError(
      'ATOMIC_COMMIT_FAILED',
      `D1-Commit fehlgeschlagen: ${String(error)}`,
    )
  }
  if (!results.every((result) => result.success))
    throw new RaidStoreError(
      'ATOMIC_COMMIT_FAILED',
      'D1 meldete einen fehlgeschlagenen Batch-Teil',
    )
  const snapshot = await readSnapshot(db, input.idempotencyKey)
  const job = await readJob(db, input.idempotencyKey)
  if (!snapshot || !job)
    throw new RaidStoreError(
      'ATOMIC_COMMIT_FAILED',
      'Snapshot oder Job fehlt nach D1-Commit',
    )
  if (
    snapshot.payloadJson !== payloadJson ||
    snapshot.simVersion !== upload.simVersion ||
    job.attackerId !== input.attackerId
  )
    throw new RaidStoreError(
      'IDEMPOTENCY_CONFLICT',
      'idempotencyKey wurde mit anderen Daten wiederverwendet',
    )
  return {
    snapshot: snapshot.payload,
    job,
    idempotent: results[1].meta.changes === 0,
  }
}
