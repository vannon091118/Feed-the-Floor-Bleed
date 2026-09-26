import { hashFinish, hashStart, hashText } from '@floor/sim-core'

const VARIANT_COUNT = 5

export function actorVariant(id: string): number {
  return hashFinish(hashText(hashStart(), id)) % VARIANT_COUNT
}
