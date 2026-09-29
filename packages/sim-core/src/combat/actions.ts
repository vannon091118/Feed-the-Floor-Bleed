import { GRID_SIZE } from '../grid'
import { createRng, deriveSeed, nextBelow } from '../prng'
import { PROVISIONAL_RULES } from './rules'
import { damageFor } from './state'
import type {
  CombatConfig,
  CombatEvent,
  CombatTrailEntry,
  CombatUnitState,
} from './types'

/**
 * Trennschritt zwischen Takt und Aktionsort im Saatindex.
 *
 * Eine Route betritt keine Zelle zweimal — die Breitensuche in `grid/path.ts`
 * führt dafür das `seen`-Feld und expandiert keine Zelle erneut —, also hat
 * keine Route mehr Schritte als das Raster Zellen. Mit diesem Faktor kodiert
 * `tick * ROUTE_SLOTS + routeIndex` jeden Takt eindeutig, solange kein
 * `routeIndex` darüber liegt; ein größeres Raster zieht den Trenner mit, statt
 * still zu kollidieren. `grid/path.test.ts` fährt die längste Route ab, die das
 * Raster erzwingt, und hält sie unter dieser Zahl.
 */
const ROUTE_SLOTS = GRID_SIZE * GRID_SIZE

/**
 * Der Rumpf jedes Ereignisses.
 *
 * `type` und `amount` setzt die Aufrufstelle, weil beide den Anlass tragen;
 * alles andere ist für Angriff, Hinterhalt, Tod und Bewegung dasselbe und
 * stand vorher an vier Stellen einzeln.
 */
function eventBase(
  actor: CombatUnitState,
  target: CombatUnitState,
  tick: number,
): Omit<CombatEvent, 'type' | 'amount'> {
  return {
    tick,
    actorId: actor.id,
    targetId: target.id,
    fromIndex: actor.routeIndex,
    toIndex: target.routeIndex,
    stage: 'running',
  }
}

/**
 * Greift der Hinterhalt?
 *
 * Die Bedingung ist entschieden und hat zwei Teile: `ambushAvailable` ist wahr,
 * solange der Verteidiger in einer Platzierungsgruppe steht und noch nicht
 * zugeschlagen hat — die Aufstellung entscheidet also, **wer** überrascht, nicht
 * der Ort. Der zweite Teil liest den Ort und nur den des Ziels: steht es in
 * genau der Zone, in der der Verteidiger aufgestellt war, ist die Lauer
 * entdeckt. Dann läuft der Angriff normal, und der Hinterhalt bleibt für ein
 * Ziel außerhalb der Zone verfügbar; verbraucht wird er erst, wenn er trifft.
 *
 * Beide Zonen kommen aus dem Log: `target.zoneId` steht als `trail[toIndex]`
 * darin, `ambushZoneId` am Spec. Deshalb kann ein Replay die Bedingung stellen,
 * ohne das Raster zu kennen.
 */
function ambushApplies(
  actor: CombatUnitState,
  target: CombatUnitState,
): boolean {
  return actor.ambushAvailable && target.zoneId !== actor.ambushZoneId
}

export function applyAttack(
  actor: CombatUnitState,
  target: CombatUnitState,
  tick: number,
  events: CombatEvent[],
  seed: number,
  config: CombatConfig,
): void {
  const rng = createRng(
    deriveSeed(seed, tick * ROUTE_SLOTS + actor.routeIndex, target.routeIndex),
  )
  const swing = config.varianceSwing
  const spread = nextBelow(rng, swing * 2 + 1) - swing
  const ambush = ambushApplies(actor, target)
  const penetration = ambush
    ? Math.trunc(
        (target.defense * PROVISIONAL_RULES.ambushDefensePenetrationPermille) /
          1000,
      )
    : 0
  const amount = damageFor(
    actor,
    penetration > 0
      ? { ...target, defense: target.defense - penetration }
      : target,
    config.variancePermille + spread,
    config,
  )
  target.hp = target.hp - amount
  if (target.hp < 0) target.hp = 0
  if (ambush) {
    // Der Hinterhalt steht vor dem Angriff, der aus ihm folgt: wer den Log von
    // vorn liest, kennt die durchdrungene Rüstung, bevor der Schaden fällt.
    actor.ambushAvailable = false
    events.push({
      ...eventBase(actor, target, tick),
      type: 'ambush',
      amount: penetration,
    })
  }
  events.push({ ...eventBase(actor, target, tick), type: 'attack', amount })
  actor.nextActionTick = tick + actor.attackCooldown
  if (target.hp === 0) {
    target.alive = false
    events.push({ ...eventBase(target, actor, tick), type: 'death', amount: 0 })
  }
}

/**
 * Ein Schritt auf der Route.
 *
 * Der Trail wird gebraucht, weil die Zone am Ort hängt: sie wandert mit der
 * Einheit und wird nicht aus dem Ziel abgeleitet.
 */
export function applyMove(
  actor: CombatUnitState,
  target: CombatUnitState,
  tick: number,
  events: CombatEvent[],
  trail: readonly CombatTrailEntry[],
): void {
  const fromIndex = actor.routeIndex
  const step = target.routeIndex > fromIndex ? 1 : -1
  actor.routeIndex = fromIndex + step
  actor.zoneId = trail[actor.routeIndex].zoneId
  actor.nextActionTick = tick + actor.moveCooldown
  events.push({
    ...eventBase(actor, target, tick),
    type: 'move',
    amount: 0,
    targetId: '',
    fromIndex,
    toIndex: actor.routeIndex,
  })
}
