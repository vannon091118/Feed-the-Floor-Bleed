import type { CombatEvent, Point } from '@floor/sim-core'
import type { FxDescriptor } from '../world'
import { cellFoot } from '../world'
import { fxSeed } from './fx-seed'
import { routePointAt } from './route-index'

export function eventFx(
  event: CombatEvent,
  path: readonly Point[],
): FxDescriptor | null {
  let kind: FxDescriptor['kind']
  let amount = 1
  if (event.type === 'move') kind = 'dust'
  else if (event.type === 'attack') {
    kind = 'hit'
    amount = event.amount
  } else if (event.type === 'death') kind = 'blood'
  else return null
  return {
    kind,
    world: cellFoot(routePointAt(path, event.toIndex)),
    amount,
    seed: fxSeed(event),
  }
}
