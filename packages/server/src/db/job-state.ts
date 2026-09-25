import { RaidStoreError } from './errors'

export const RAID_JOB_TTL_MS = 15 * 60 * 1000
export const RAID_JOB_STATUSES = [
  'accepted',
  'queued',
  'running',
  'completed',
  'failed',
  'expired',
] as const
export type RaidJobStatus = (typeof RAID_JOB_STATUSES)[number]
export type RequestedRaidJobStatus = Exclude<RaidJobStatus, 'expired'>

export function assertTransitionPayload(
  target: RequestedRaidJobStatus,
  resultJson: string | null,
  failureCode: string | null,
): void {
  if (target === 'completed' && !isJsonObject(resultJson))
    throw new RaidStoreError(
      'INVALID_INPUT',
      'completed benötigt ein JSON-Objekt als Ergebnis',
    )
  if (target === 'failed' && !failureCode)
    throw new RaidStoreError(
      'INVALID_INPUT',
      'failed benötigt einen failureCode',
    )
  if (target !== 'completed' && resultJson)
    throw new RaidStoreError(
      'INVALID_INPUT',
      `${target} darf kein Ergebnis tragen`,
    )
  if (target !== 'failed' && failureCode)
    throw new RaidStoreError(
      'INVALID_INPUT',
      `${target} darf keinen failureCode tragen`,
    )
}

function isJsonObject(value: string | null): value is string {
  if (!value) return false
  try {
    const parsed: unknown = JSON.parse(value)
    return (
      parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
    )
  } catch {
    return false
  }
}
