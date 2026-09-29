import type {
  CellTypeValue,
  CombatEvent,
  CombatLog,
  CombatStage,
  CombatTrailEntry,
  CombatUnitSpec,
} from '@floor/contracts'

export type PhaseId = 'route' | 'combat' | 'result'
export type TrailBadge = 'placement' | 'spawn' | 'boss'

export interface TimelinePhase {
  id: PhaseId
  range: { from: number; to: number }
}

export interface TrailStep {
  index: number
  entry: CombatTrailEntry
}

export interface EventCluster {
  type: CombatEvent['type']
  count: number
}

export interface TimelineSections {
  trail: TrailStep[]
  routeEnd: number
  combatStart: number
  lastTick: number
  phases: TimelinePhase[]
}

export interface EventBuckets {
  route: CombatEvent[]
  combat: CombatEvent[]
  result: CombatEvent[]
}

/** Ein Hinterhalt in den Worten des Spiels: wann, und wen es getroffen hat. */
export interface AmbushEvent {
  tick: number
  actorId: string
  target: string
}

export const PHASE_LABELS: Record<PhaseId, string> = {
  route: 'Routen-Phase',
  combat: 'Kampf-Phase',
  result: 'Ergebnis-Phase',
}

export const STAGE_LABELS: Record<CombatStage, string> = {
  'heroes-win': 'Heldensieg',
  'monsters-win': 'Boss hält',
  timeout: 'Zeitlimit erreicht',
}

const PLACEMENT_CELL: CellTypeValue = 2
const SPAWN_CELL: CellTypeValue = 3
const BOSS_CELL: CellTypeValue = 4

const CELL_BADGES: Partial<Record<CellTypeValue, TrailBadge>> = {
  [PLACEMENT_CELL]: 'placement',
  [SPAWN_CELL]: 'spawn',
  [BOSS_CELL]: 'boss',
}

export const TRAIL_BADGE_LABELS: Record<TrailBadge, string> = {
  placement: 'Platzierung',
  spawn: 'Spawn',
  boss: 'Boss',
}

export function trailBadge(cell: number): TrailBadge | null {
  return CELL_BADGES[cell as CellTypeValue] ?? null
}

function lastTickOf(
  events: readonly CombatEvent[],
  type: CombatEvent['type'],
): number {
  let tick = 0
  for (const event of events) {
    if (event.type === type && event.tick > tick) tick = event.tick
  }
  return tick
}

/**
 * Zerlegt den Log in die drei Timeline-Abschnitte.
 *
 * Die Routen-Phase reicht bis zur letzten Bewegung, die Kampf-Phase beginnt
 * mit dem ersten Angriff und die Ergebnis-Phase sitzt auf dem End-Ereignis.
 * Ohne Angriffe fällt die Kampf-Phase auf das Routen-Ende zurück.
 */
export function buildTimelineSections(log: CombatLog): TimelineSections {
  const trail = log.trail.map((entry, index) => ({ index, entry }))
  const routeEnd = lastTickOf(log.events, 'move')
  const firstAttack = log.events.find((event) => event.type === 'attack')
  const combatStart = firstAttack ? firstAttack.tick : routeEnd
  const endEvent = log.events[log.events.length - 1]
  const lastTick = endEvent ? endEvent.tick : 0
  return {
    trail,
    routeEnd,
    combatStart,
    lastTick,
    phases: [
      { id: 'route', range: { from: 0, to: routeEnd } },
      { id: 'combat', range: { from: combatStart, to: lastTick } },
      { id: 'result', range: { from: lastTick, to: lastTick } },
    ],
  }
}

/** Jedes Ereignis landet in genau einem Bucket; `end` gehört zur Ergebnis-Phase. */
export function eventsByPhase(
  log: CombatLog,
  sections: TimelineSections,
): EventBuckets {
  const buckets: EventBuckets = { route: [], combat: [], result: [] }
  for (const event of log.events) {
    if (event.type === 'end') buckets.result.push(event)
    else if (event.tick < sections.combatStart) buckets.route.push(event)
    else buckets.combat.push(event)
  }
  return buckets
}

/**
 * Die Hinterhalt-Ereignisse einzeln, in Log-Reihenfolge.
 *
 * Die Klasse zählt `clusterEvents`; hier steht jedes Vorkommen mit seinem Tick,
 * damit der Spieler den Hinterhalt als Ereignis liest und nicht nur als Zahl in
 * einer Klasse. Das Ziel wird zur Seite des Getroffenen aufgelöst — die Kennung
 * `monster-0` gehört nicht auf den Bildschirm.
 */
const TARGET_LABELS: Record<CombatUnitSpec['side'], string> = {
  heroes: 'einen Helden',
  monsters: 'ein Monster',
}
const TARGET_FALLBACK = 'ein Ziel'

export function ambushEvents(log: CombatLog): AmbushEvent[] {
  const sideById = new Map<string, CombatUnitSpec['side']>(
    log.units.map((unit) => [unit.id, unit.side]),
  )
  return log.events
    .filter((event) => event.type === 'ambush')
    .map((event) => {
      const side = sideById.get(event.targetId)
      return {
        tick: event.tick,
        actorId: event.actorId,
        target: side ? TARGET_LABELS[side] : TARGET_FALLBACK,
      }
    })
}

/** Cluster der Kampf-Phase nach Ereignis-Klasse, in Logs-Reihenfolge. */
export function clusterEvents(events: readonly CombatEvent[]): EventCluster[] {
  const counts = new Map<CombatEvent['type'], number>()
  for (const event of events) {
    counts.set(event.type, (counts.get(event.type) ?? 0) + 1)
  }
  return [...counts].map(([type, count]) => ({ type, count }))
}

export function phaseForTick(
  sections: TimelineSections,
  tick: number,
): PhaseId {
  if (tick >= sections.lastTick) return 'result'
  if (tick < sections.combatStart) return 'route'
  return 'combat'
}
