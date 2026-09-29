import { z } from 'zod'
import { CellTypeSchema } from './cell'

export const CombatTrailEntrySchema = z
  .object({
    x: z.number().int().min(0).max(63),
    y: z.number().int().min(0).max(63),
    cell: CellTypeSchema,
    /**
     * Zone der Zelle; `-1` steht für „keine Zone“.
     *
     * Die Zone gehört in den Trail: ein Replay liest ausschließlich den Log,
     * und die Zone einer Einheit ist die Zone ihrer aktuellen Route-Zelle.
     */
    zoneId: z.number().int().min(-1),
  })
  .strict()

export type CombatTrailEntry = z.infer<typeof CombatTrailEntrySchema>
