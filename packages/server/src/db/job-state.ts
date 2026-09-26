import {
  canTransitionRaidJob,
  ErrorCodeSchema,
  RAID_JOB_STATUSES,
  RAID_JOB_TTL_MS,
  type RaidJobStatus,
} from '@floor/contracts'
import { RaidStoreError } from './errors'

export type { RaidJobStatus }
/**
 * Status, TTL und Fehlercodes kommen aus `@floor/contracts`. Vor T1.3 standen
 * dieselben Werte an drei Stellen: hier, in der D1-Check-Constraint und im
 * Protokoll — mit der Folge, dass `timeout` in der Datenbank möglich, im
 * Contract aber nicht darstellbar war. Jetzt gibt es genau eine Quelle.
 */
export { canTransitionRaidJob, RAID_JOB_STATUSES, RAID_JOB_TTL_MS }

export type RequestedRaidJobStatus = Exclude<RaidJobStatus, 'expired'>

const knownFailureCodes = new Set<string>(ErrorCodeSchema.options)

export function assertFailureCode(failureCode: string): void {
  if (!knownFailureCodes.has(failureCode))
    throw new RaidStoreError(
      'INVALID_INPUT',
      `failureCode ${failureCode} gehört nicht zum Contract`,
    )
}

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
  if (target === 'failed' && failureCode) assertFailureCode(failureCode)
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
