import { z } from 'zod'
import { RaidSnapshotSchema } from './raid-snapshot'
import { versionEnvelope } from './version'

const opaqueIdSchema = z.string().min(1)
const floorSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const seedSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }
const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ]),
)
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

export const MatchResponseSchema = versionEnvelope
  .extend({
    seed: seedSchema,
    snapshot: RaidSnapshotSchema,
    floor: floorSchema,
  })
  .strict()

export const ResultPayloadSchema = versionEnvelope
  .extend({
    token: opaqueIdSchema,
    floor: floorSchema,
    hash: opaqueIdSchema,
    summary: z.record(jsonValueSchema),
  })
  .strict()

export type UploadRequest = z.infer<typeof UploadRequestSchema>
export type MatchResponse = z.infer<typeof MatchResponseSchema>
export type ResultPayload = z.infer<typeof ResultPayloadSchema>

export const ErrorCodeSchema = z.enum(['blocked', 'invalid-hash', 'protected'])
export const ErrorPayloadSchema = versionEnvelope
  .extend({ code: ErrorCodeSchema })
  .strict()
export type ErrorCode = z.infer<typeof ErrorCodeSchema>
export type ErrorPayload = z.infer<typeof ErrorPayloadSchema>
