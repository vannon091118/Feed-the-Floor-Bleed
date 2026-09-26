import type { CombatLog, Point } from '@floor/sim-core'
import type { ActorDescriptor, FxDescriptor } from '../world'
import { combatActors } from './actor-frame'
import { eventFx } from './event-fx'
import { routeActors } from './route-actors'

export interface CombatFrame {
  actors: ActorDescriptor[]
  fx: FxDescriptor[]
}

/**
 * Präsentationsrahmen zum Tick `playbackTick`. FX entstehen nur für Ereignisse
 * im Fenster `(fromTick, playbackTick]`, damit kein Frame Ereignisse erneut
 * ausschüttet.
 */
export function combatFrame(
  log: CombatLog,
  path: readonly Point[],
  playbackTick: number,
  fromTick: number,
): CombatFrame {
  const actors = combatActors(log.units, log.events, path, playbackTick)
  const start = Math.max(fromTick, -1)
  const fx: FxDescriptor[] = []
  for (const event of log.events) {
    if (event.tick <= start || event.tick > playbackTick) continue
    const descriptor = eventFx(event, path)
    if (descriptor) fx.push(descriptor)
  }
  return { actors, fx }
}

export { routeActors }
