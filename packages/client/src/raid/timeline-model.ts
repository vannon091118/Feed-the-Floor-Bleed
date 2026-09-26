import type {
  CellTypeValue,
  CombatEvent,
  CombatLog,
  CombatStage,
  CombatTrailEntry,
} from '@floor/contracts'

export type PhaseId = 'route' | 'combat' | 'result'
export type TrailBadge = 'trap' | 'spawn' | 'boss'

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

export interface ResultCardData {
  stage: CombatStage
  timeout: boolean
  heroes: number
  monsters: number
  bossAlive: boolean
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

const TRAP_CELL: CellTypeValue = 2
const SPAWN_CELL: CellTypeValue = 3
const BOSS_CELL: CellTypeValue = 4

const CELL_BADGES: Partial<Record<CellTypeValue, TrailBadge>> = {
  [TRAP_CELL]: 'trap',
  [SPAWN_CELL]: 'spawn',
  [BOSS_CELL]: 'boss',
}

export const TRAIL_BADGE_LABELS: Record<TrailBadge, string> = {
  trap: 'Falle',
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

/** Überlebende aus Einheiten und Todesereignissen, ohne zweite Simulation. */
export function resultCard(log: CombatLog): ResultCardData {
  const dead = new Set(
    log.events
      .filter((event) => event.type === 'death')
      .map((event) => event.actorId),
  )
  let heroes = 0
  let monsters = 0
  let bossAlive = false
  for (const unit of log.units) {
    if (dead.has(unit.id)) continue
    if (unit.role === 'hero') heroes += 1
    else if (unit.role === 'boss') bossAlive = true
    else monsters += 1
  }
  return {
    stage: log.stage,
    timeout: log.stage === 'timeout',
    heroes,
    monsters,
    bossAlive,
  }
}
