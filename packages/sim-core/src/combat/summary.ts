import { type CombatSummary, CombatSummarySchema } from '@floor/contracts'
import { isBoss, isBossAlive } from './boss'
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
 * Überlebende Monster **ohne** den Boss.
 *
 * Der Boss trägt `side: 'monsters'`, hat aber ein eigenes Summary-Feld
 * `bossAlive`. Zählte `monstersAlive` ihn mit, wäre er doppelt gezählt und die
 * Anzeige widerspräche sich selbst; genau das war der Zustand vor diesem Fix.
 * Die Zählung nutzt dieselbe Rollenerkennung wie `isBossAlive`, also können die
 * beiden Felder nicht auseinanderlaufen.
 */
function aliveMonsters(log: CombatLog, fallen: ReadonlySet<string>): number {
  return log.units.filter(
    (unit) => unit.side === 'monsters' && !isBoss(unit) && !fallen.has(unit.id),
  ).length
}

/**
 * Der eingefrorene Verteidiger-Roster: alle Einheiten der Monster-Seite, Boss
 * inklusive. Die Zahl steht im Log und wird deshalb hier gezählt und nicht
 * übergeben; sie beschreibt den Kampfaufbau, nicht seinen Ausgang.
 */
function fieldedDefenders(log: CombatLog): number {
  return log.units.filter((unit) => unit.side === 'monsters').length
}

/**
 * Typisierte Kurzfassung des Logs.
 *
 * Das Schema wird hier bewusst angewandt: Die Summary entsteht im Core, aber
 * sie geht über die Leitung. Ein Parse-Fehler hier ist ein Programmierfehler
 * und darf nicht erst im Client auffallen.
 *
 * Diese Funktion ist die einzige Quelle der Überlebendenzahlen. Leser zählen
 * nicht selbst nach: `monstersAlive` ohne den Boss und `bossAlive` als eigenes
 * Feld sind hier festgelegt, nicht in jedem Anzeiger neu.
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
    defendersTotal: fieldedDefenders(log),
    heroesAlive: aliveOnSide(log, fallen, 'heroes'),
    monstersAlive: aliveMonsters(log, fallen),
    bossAlive: isBossAlive(log, fallen),
  })
}
