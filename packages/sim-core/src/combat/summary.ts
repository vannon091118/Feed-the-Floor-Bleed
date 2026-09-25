import { type CombatSummary, CombatSummarySchema } from '@floor/contracts'
import type { CombatLog, CombatSide } from './types'

function aliveOnSide(
  log: CombatLog,
  fallen: ReadonlySet<string>,
  side: CombatSide,
) {
  return log.units.filter((unit) => unit.side === side && !fallen.has(unit.id))
    .length
}

/**
 * Typisierte Kurzfassung des Logs.
 *
 * Das Schema wird hier bewusst angewandt: Die Summary entsteht im Core, aber
 * sie geht über die Leitung. Ein Parse-Fehler hier ist ein Programmierfehler
 * und darf nicht erst im Client auffallen.
 */
export function summarizeCombat(log: CombatLog): CombatSummary {
  const fallen = new Set<string>()
  let attacks = 0
  let damage = 0
  for (const event of log.events) {
    if (event.type === 'attack') {
      attacks += 1
      damage += event.amount
    }
    if (event.type === 'death') fallen.add(event.actorId)
  }
  return CombatSummarySchema.parse({
    stage: log.stage,
    ticks: log.ticks,
    hash: log.hash,
    events: log.events.length,
    attacks,
    damage,
    heroesAlive: aliveOnSide(log, fallen, 'heroes'),
    monstersAlive: aliveOnSide(log, fallen, 'monsters'),
    bossAlive: log.units.some(
      (unit) => unit.role === 'boss' && !fallen.has(unit.id),
    ),
  })
}
