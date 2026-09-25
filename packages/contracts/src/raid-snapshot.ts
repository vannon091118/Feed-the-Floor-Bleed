import { z } from 'zod'
import { DungeonGridSchema } from './grid'
import { versionEnvelope } from './version'

const opaqueIdSchema = z.string().min(1)
const wholeNumberSchema = z.number().int().safe()
const monsterSlotSchema = z
  .object({ monsterId: opaqueIdSchema.nullable() })
  .strict()
const activeTeamMemberSchema = z
  .object({
    heroId: opaqueIdSchema,
    temporaryFatigue: wholeNumberSchema,
    temporaryInjury: wholeNumberSchema,
  })
  .strict()

export const raidSnapshotShape = {
  resources: z
    .object({ gold: wholeNumberSchema, materials: wholeNumberSchema })
    .strict(),
  monsterSlots: z.array(monsterSlotSchema).length(5),
  activeTeam: z.array(activeTeamMemberSchema).min(1).max(5),
  dungeon: DungeonGridSchema,
}

export const RaidSnapshotSchema = versionEnvelope
  .extend(raidSnapshotShape)
  .strict()
export type RaidSnapshot = z.infer<typeof RaidSnapshotSchema>
