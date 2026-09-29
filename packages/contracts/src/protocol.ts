import { z } from 'zod'
import { CombatHashSchema, CombatLogSchema } from './combat-log'
import { CombatSummarySchema } from './combat-summary'
import { RaidPublicViewSchema } from './raid-public'
import { RaidSnapshotSchema } from './raid-snapshot'
import { versionEnvelope } from './version'

const opaqueIdSchema = z.string().min(1)
const floorSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const seedSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const tacticsSchema = z.array(z.array(opaqueIdSchema).max(3)).max(5)

export const UploadRequestSchema = RaidSnapshotSchema.extend({
  tactics: tacticsSchema,
})
  .strict()
  .superRefine((payload, context) => {
    if (payload.tactics.length !== payload.activeTeam.length)
      context.addIssue({
        code: 'custom',
        path: ['tactics'],
        message: 'jeder aktive Held benötigt eine Taktikliste',
      })
  })

/**
 * Was ein Angreifer zur Auswahl bekommt: Seed, Etage und die öffentliche
 * Sicht. Hier steht ausdrücklich `RaidPublicViewSchema` und nicht der private
 * Stand — der Roster hat in dieser Antwort nichts zu suchen. Der Server führt
 * den privaten Stand weiter und rechnet damit; der Angreifer spielt nur ab.
 */
export const MatchResponseSchema = versionEnvelope
  .extend({
    seed: seedSchema,
    snapshot: RaidPublicViewSchema,
    floor: floorSchema,
  })
  .strict()

/**
 * Ergebnis ohne Log: Token, Etage, kanonischer Hash und typisierte Kurzfassung.
 * Der vollständige Log ist ein eigenes Artefakt (`RaidLogPayloadSchema`), damit
 * `result_json` klein bleibt und der Log bei Bedarf nachgeladen werden kann.
 */
export const ResultPayloadSchema = versionEnvelope
  .extend({
    token: opaqueIdSchema,
    floor: floorSchema,
    hash: CombatHashSchema,
    summary: CombatSummarySchema,
  })
  .strict()

/** Serialisierbarer Ergebnislog inklusive Envelope, Token, Etage und Hash. */
export const RaidLogPayloadSchema = versionEnvelope
  .extend({
    token: opaqueIdSchema,
    floor: floorSchema,
    hash: CombatHashSchema,
    log: CombatLogSchema,
  })
  .strict()

/**
 * Fehlercodes des Jobs. `timeout` gehört hierher, weil eine abgelaufene
 * Auftragsfrist (`status: 'expired'`) genau dann ein Fehler ist und kein
 * Ergebnis. Der Kampf-Timeout ist dagegen ein *erfolgreiches* Ergebnis mit
 * `summary.stage === 'timeout'`.
 */
export const ErrorCodeSchema = z.enum([
  'blocked',
  'invalid-hash',
  'invalid-request',
  'protected',
  'timeout',
])

export const ErrorPayloadSchema = versionEnvelope
  .extend({
    code: ErrorCodeSchema,
    detail: z.string().min(1).max(200).optional(),
  })
  .strict()

export const RAID_JOB_TTL_MS = 15 * 60 * 1000

export type UploadRequest = z.infer<typeof UploadRequestSchema>
export type MatchResponse = z.infer<typeof MatchResponseSchema>
export type ResultPayload = z.infer<typeof ResultPayloadSchema>
export type RaidLogPayload = z.infer<typeof RaidLogPayloadSchema>
export type ErrorCode = z.infer<typeof ErrorCodeSchema>
export type ErrorPayload = z.infer<typeof ErrorPayloadSchema>
