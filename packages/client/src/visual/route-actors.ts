import type { Point } from '@floor/sim-core'
import { type ActorDescriptor, type ActorKind, cellFoot } from '../world'
import { routePointAt } from './route-index'
import { actorVariant } from './variant'

/** Leerlaufbesetzung für den Editor: Helden am Start, Boss am Ziel. */
export function routeActors(path: readonly Point[]): ActorDescriptor[] {
  if (path.length === 0) return []
  const specs: Array<{ id: string; kind: ActorKind; index: number }> = [
    { id: 'hero-a', kind: 'hero', index: 0 },
    { id: 'hero-b', kind: 'hero', index: 0 },
    { id: 'hero-c', kind: 'hero', index: 1 },
    { id: 'boss-0', kind: 'boss', index: path.length - 1 },
  ]
  return specs.map((spec) => {
    const cell = routePointAt(path, spec.index)
    return {
      id: spec.id,
      kind: spec.kind,
      cell,
      world: cellFoot(cell),
      height: spec.kind === 'boss' ? 18 : 14,
      hpRatio: 1,
      facing: 1,
      moving: false,
      variant: actorVariant(spec.id),
    }
  })
}
