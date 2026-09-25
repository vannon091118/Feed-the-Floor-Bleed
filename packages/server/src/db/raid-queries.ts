import type { D1Database } from './d1'
import {
  type JobRow,
  type RaidJobRecord,
  type SnapshotRow,
  type StoredSnapshot,
  toJob,
  toSnapshot,
} from './raid-records'

export const EXPIRE_ATTACKER_OPEN_JOBS = `UPDATE raid_jobs
SET status = 'expired', failure_code = 'timeout', updated_at = ?, revision = revision + 1
WHERE attacker_id = ? AND status IN ('accepted', 'queued', 'running') AND expires_at <= ?`

export const INSERT_SNAPSHOT = `INSERT OR IGNORE INTO raid_snapshots
(id, request_key, sim_version, payload_json, created_at) VALUES (?, ?, ?, ?, ?)`

export const INSERT_JOB = `INSERT INTO raid_jobs
(id, snapshot_id, attacker_id, status, created_at, updated_at, expires_at)
SELECT ?, ?, ?, 'accepted', ?, ?, ?
WHERE EXISTS (
  SELECT 1 FROM raid_snapshots
  WHERE id = ? AND request_key = ? AND sim_version = ? AND payload_json = ?
)
ON CONFLICT(id) DO NOTHING`

export const UPDATE_JOB_STATUS = `UPDATE raid_jobs
SET status = ?, updated_at = ?, revision = revision + 1, result_json = ?, failure_code = ?
WHERE id = ? AND status = ? AND expires_at > ?`

export const EXPIRE_JOB = `UPDATE raid_jobs
SET status = 'expired', failure_code = 'timeout', updated_at = ?, revision = revision + 1
WHERE id = ? AND status IN ('accepted', 'queued', 'running') AND expires_at <= ?`

export function readJob(
  db: D1Database,
  id: string,
): Promise<RaidJobRecord | null> {
  return db
    .prepare(`SELECT id, snapshot_id, target_snapshot_id, attacker_id, status,
created_at, updated_at, expires_at, result_json, failure_code, revision
FROM raid_jobs WHERE id = ?`)
    .bind(id)
    .first<JobRow>()
    .then((row) => (row ? toJob(row) : null))
}

export function readSnapshot(
  db: D1Database,
  id: string,
): Promise<StoredSnapshot | null> {
  return db
    .prepare(`SELECT id, request_key, sim_version, payload_json, created_at
FROM raid_snapshots WHERE id = ?`)
    .bind(id)
    .first<SnapshotRow>()
    .then((row) => (row ? toSnapshot(row) : null))
}
