export type RaidStoreErrorCode =
  | 'ATOMIC_COMMIT_FAILED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'INVALID_INPUT'
  | 'INVALID_TRANSITION'
  | 'JOB_NOT_FOUND'
  | 'OPEN_JOB_CONFLICT'

export class RaidStoreError extends Error {
  constructor(
    readonly code: RaidStoreErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'RaidStoreError'
  }
}
