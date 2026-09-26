import { z } from 'zod'
import { CellTypeSchema } from './cell'

export const CombatTrailEntrySchema = z
  .object({
    x: z.number().int().min(0).max(63),
    y: z.number().int().min(0).max(63),
    cell: CellTypeSchema,
  })
  .strict()

export type CombatTrailEntry = z.infer<typeof CombatTrailEntrySchema>
