import { z } from 'zod'

const pointSchema = z
  .object({
    x: z.number().int().min(0).max(63),
    y: z.number().int().min(0).max(63),
  })
  .strict()
const cellTypeSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
])

export const GridPointSchema = pointSchema
export const DungeonGridSchema = z
  .object({
    cells: z.array(cellTypeSchema).length(4096),
    spawn: pointSchema,
    boss: pointSchema,
  })
  .strict()
  .superRefine((grid, context) => {
    const spawnIndex = grid.spawn.y * 64 + grid.spawn.x
    const bossIndex = grid.boss.y * 64 + grid.boss.x
    if (spawnIndex === bossIndex)
      context.addIssue({
        code: 'custom',
        message: 'spawn und boss müssen verschiedene Zellen sein',
      })
    if (grid.cells[spawnIndex] !== 3)
      context.addIssue({
        code: 'custom',
        message: 'spawn-Zelle muss Spawn-Punkt sein',
      })
    if (grid.cells[bossIndex] !== 4)
      context.addIssue({
        code: 'custom',
        message: 'boss-Zelle muss Boss-Slot sein',
      })
    if (grid.cells.filter((cell) => cell === 3).length !== 1)
      context.addIssue({
        code: 'custom',
        message: 'genau ein Spawn-Punkt ist erlaubt',
      })
    if (grid.cells.filter((cell) => cell === 4).length !== 1)
      context.addIssue({
        code: 'custom',
        message: 'genau ein Boss-Slot ist erlaubt',
      })
  })

export type GridPoint = z.infer<typeof GridPointSchema>
export type DungeonGridPayload = z.infer<typeof DungeonGridSchema>

export const PathResultSchema = z
  .object({
    mode: z.enum(['within-budget', 'trap-fallback', 'unreachable']),
    path: z.array(pointSchema),
    movementCost: z.number().nonnegative(),
    detourCost: z.number().nonnegative(),
  })
  .strict()
  .superRefine((result, context) => {
    const unreachable = result.mode === 'unreachable'
    if (
      unreachable &&
      (result.path.length !== 0 ||
        result.movementCost !== Number.POSITIVE_INFINITY ||
        result.detourCost !== Number.POSITIVE_INFINITY)
    )
      context.addIssue({
        code: 'custom',
        message:
          'unreachable benötigt leeren Pfad und positive Infinity-Kosten',
      })
    if (
      !unreachable &&
      (result.path.length === 0 ||
        !Number.isFinite(result.movementCost) ||
        !Number.isFinite(result.detourCost))
    )
      context.addIssue({
        code: 'custom',
        message: 'erreichbare Route benötigt Pfad und endliche Kosten',
      })
  })

export type GridPathResult = z.infer<typeof PathResultSchema>
