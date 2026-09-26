import { z } from 'zod'

export const CellTypeSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
])
export type CellTypeValue = z.infer<typeof CellTypeSchema>
