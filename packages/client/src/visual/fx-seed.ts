import {
  type CombatEvent,
  hashFinish,
  hashStart,
  hashText,
  hashWord,
} from '@floor/sim-core'

/** Seeds bleiben am Event selbst hängen, nicht an seiner Emissionsreihenfolge. */
export function fxSeed(event: CombatEvent): number {
  let seed = hashText(hashStart(), event.type)
  seed = hashText(seed, event.actorId)
  seed = hashText(seed, event.targetId)
  seed = hashWord(seed, event.tick)
  seed = hashWord(seed, event.fromIndex)
  seed = hashWord(seed, event.toIndex)
  seed = hashWord(seed, event.amount)
  return hashFinish(seed)
}
