import {
  CONTRACT_VERSION,
  type CombatConfig,
  CombatLogSchema,
  type RaidLogPayload,
  RaidLogPayloadSchema,
  type ResultPayload,
  ResultPayloadSchema,
  sim_version,
} from '@floor/contracts'
import type { DungeonGrid } from '../grid'
import type { TeamCondition } from './conditions'
import { resolveCombat } from './resolve'
import { summarizeCombat } from './summary'

export interface SnapshotRaidInput {
  grid: DungeonGrid
  teamSize: number
  /** Die Nachwirkung je Held aus `activeTeam`, in derselben Reihenfolge. */
  team?: readonly TeamCondition[]
  /** Die Verteidiger in Slot-Reihenfolge; leere Plätze als `null`. */
  defenders: readonly { baseId: string | null }[]
  seed: number
  floor: number
  token: string
  config?: CombatConfig
}

export interface SnapshotRaid {
  result: ResultPayload
  log: RaidLogPayload
}

const envelope = {
  contractVersion: CONTRACT_VERSION,
  simVersion: sim_version,
}

/**
 * Rechnet einen eingefrorenen Snapshot zu Ergebnis und serialisierbarem Log.
 *
 * Die Engine kennt keine Protokollversion — erst die Übergabe an den Contract
 * setzt den Envelope. Beide Payloads werden geparst und dadurch tief kopiert:
 * Was hier zurückkommt, ist JSON-stabil und kann unverändert persistiert oder
 * an einen Client gesendet werden.
 */
export function resolveSnapshotRaid(input: SnapshotRaidInput): SnapshotRaid {
  const simulated = resolveCombat({
    seed: input.seed,
    grid: input.grid,
    teamSize: input.teamSize,
    team: input.team,
    defenders: input.defenders,
    config: input.config,
  })
  const log = CombatLogSchema.parse(simulated)
  const shared = { ...envelope, token: input.token, floor: input.floor }
  return {
    result: ResultPayloadSchema.parse({
      ...shared,
      hash: log.hash,
      summary: summarizeCombat(log),
    }),
    log: RaidLogPayloadSchema.parse({ ...shared, hash: log.hash, log }),
  }
}
