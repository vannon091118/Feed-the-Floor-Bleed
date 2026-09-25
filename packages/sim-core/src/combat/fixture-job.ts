import {
  CONTRACT_VERSION,
  type CombatConfig,
  type ErrorCode,
  ErrorPayloadSchema,
  RAID_JOB_TTL_MS,
  RaidJobSchema,
  type TerminalRaidJob,
  UploadRequestSchema,
  sim_version,
} from '@floor/contracts'
import { hasValidRoute, toDungeonGrid } from '../grid'
import { replayCombat } from './replay'
import { resolveSnapshotRaid } from './resolve-snapshot'

export interface FixtureRaidInput {
  /** Ungeprüfter Upload — bewusst `unknown`, der Vertrag ist die Instanz. */
  upload: unknown
  jobId: string
  seed: number
  floor: number
  createdAt: number
  observedAt: number
  ttlMs?: number
  /** Optionale Kampfregeln; Teil des Logs und damit Teil des Hashes. */
  config?: CombatConfig
}

const envelope = {
  contractVersion: CONTRACT_VERSION,
  simVersion: sim_version,
}

function base(input: FixtureRaidInput, expiresAt: number) {
  return {
    ...envelope,
    id: input.jobId,
    floor: input.floor,
    seed: input.seed,
    revision: 0,
    expiresAt,
  }
}

function failure(
  input: FixtureRaidInput,
  expiresAt: number,
  code: ErrorCode,
  detail: string,
): TerminalRaidJob {
  // Jeder Rückgabeweg ist ein `failed`-Variant; der Cast engt nur den von Zod
  // zurückgegebenen Gesamttyp auf den bereits bekannten Zweig.
  return RaidJobSchema.parse({
    ...base(input, expiresAt),
    status: 'failed',
    error: ErrorPayloadSchema.parse({ ...envelope, code, detail }),
  }) as TerminalRaidJob
}

/**
 * Erster Zod-Issue als stabiler Detail-Key. Absichtlich kein Zod-Message:
 * Meldungstexte ändern sich zwischen Versionen, Feldpfade nicht.
 */
function issueDetail(error: {
  issues: ReadonlyArray<{ path: readonly (string | number)[] }>
}) {
  const first = error.issues[0]
  if (!first || first.path.length === 0) return 'payload'
  return first.path.join('.')
}

function occupiedSlots(slots: ReadonlyArray<{ monsterId: string | null }>) {
  let count = 0
  for (const slot of slots) if (slot.monsterId) count += 1
  return count
}

/**
 * Lokale Fixture-Ausführung eines Auftrags — ohne Netz, ohne Uhr, ohne
 * Zufall von außen. `createdAt`/`observedAt` werden übergeben statt gelesen,
 * damit der Lauf deterministisch und im Test wiederholbar bleibt.
 *
 * Der Rückgabewert ist durch `RaidJobSchema` validiert: Dieser Aufruf kann
 * strukturell keinen unserialisierbaren Auftrag liefern.
 */
export function runFixtureRaid(input: FixtureRaidInput): TerminalRaidJob {
  const expiresAt = input.createdAt + (input.ttlMs ?? RAID_JOB_TTL_MS)
  const parsed = UploadRequestSchema.safeParse(input.upload)
  if (!parsed.success)
    return failure(
      input,
      expiresAt,
      'invalid-request',
      issueDetail(parsed.error),
    )
  if (input.observedAt >= expiresAt)
    return RaidJobSchema.parse({
      ...base(input, expiresAt),
      status: 'expired',
      error: ErrorPayloadSchema.parse({ ...envelope, code: 'timeout' }),
    }) as TerminalRaidJob
  const grid = toDungeonGrid(parsed.data.dungeon)
  if (!hasValidRoute(grid))
    return failure(input, expiresAt, 'blocked', 'dungeon.route')
  const raid = resolveSnapshotRaid({
    grid,
    teamSize: parsed.data.activeTeam.length,
    monsterSlots: occupiedSlots(parsed.data.monsterSlots),
    seed: input.seed,
    floor: input.floor,
    token: input.jobId,
    config: input.config,
  })
  if (replayCombat(raid.log.log).hash !== raid.log.hash)
    return failure(input, expiresAt, 'invalid-hash', raid.log.hash)
  return RaidJobSchema.parse({
    ...base(input, expiresAt),
    status: 'completed',
    result: raid.result,
  }) as TerminalRaidJob
}
