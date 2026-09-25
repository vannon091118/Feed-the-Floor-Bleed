import type { RaidSnapshot, UploadRequest } from '@floor/contracts'
import { RaidSnapshotSchema } from '@floor/contracts'
import { RaidStoreError } from './errors'
import type { RaidJobStatus } from './job-state'

export interface SnapshotRow {
  id: string
  request_key: string | null
  sim_version: string
  payload_json: string
  created_at: number
}
export interface JobRow {
  id: string
  snapshot_id: string
  target_snapshot_id: string | null
  attacker_id: string
  status: RaidJobStatus
  created_at: number
  updated_at: number
  expires_at: number
  result_json: string | null
  failure_code: string | null
  revision: number
}
export interface RaidJobRecord {
  id: string
  snapshotId: string
  targetSnapshotId: string | null
  attackerId: string
  status: RaidJobStatus
  createdAt: number
  updatedAt: number
  expiresAt: number
  resultJson: string | null
  failureCode: string | null
  revision: number
}
export interface CommitRaidInput {
  idempotencyKey: string
  attackerId: string
  now: number
  upload: UploadRequest
}
export interface CommitRaidResult {
  snapshot: RaidSnapshot
  job: RaidJobRecord
  idempotent: boolean
}
export interface StoredSnapshot {
  payload: RaidSnapshot
  payloadJson: string
  simVersion: string
}

export function toJob(row: JobRow): RaidJobRecord {
  return {
    id: row.id,
    snapshotId: row.snapshot_id,
    targetSnapshotId: row.target_snapshot_id,
    attackerId: row.attacker_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
    resultJson: row.result_json,
    failureCode: row.failure_code,
    revision: row.revision,
  }
}
export function toSnapshot(row: SnapshotRow): StoredSnapshot {
  return {
    payload: RaidSnapshotSchema.parse(JSON.parse(row.payload_json)),
    payloadJson: row.payload_json,
    simVersion: row.sim_version,
  }
}
export function assertId(value: string, name: string): void {
  if (!value)
    throw new RaidStoreError('INVALID_INPUT', `${name} muss nicht leer sein`)
}
export function assertNow(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new RaidStoreError(
      'INVALID_INPUT',
      'now muss eine nichtnegative sichere Ganzzahl sein',
    )
}
