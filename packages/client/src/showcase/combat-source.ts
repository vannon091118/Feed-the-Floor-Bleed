import {
  type CombatLog,
  type DungeonGrid,
  type PathResult,
  hasValidRoute,
  resolveSnapshotRaid,
} from '@floor/sim-core'
import { fixture, fixtureRaid } from '../fixture-data'

function occupiedSlots(): number {
  return fixture.monsterSlots.filter((slot) => slot.monsterId).length
}

/**
 * Rechnet denselben Core-Log, den der Fixture-Raid nutzt.
 *
 * Die Szene benutzt `resolveSnapshotRaid` direkt, weil sie den vollständigen
 * Log mit Einheiten und Ereignissen braucht — die Auftragsantwort trägt nur
 * die Kurzfassung. Es entsteht kein zweiter Kampfpfad: derselbe Core-Aufruf,
 * dieselbe Quelle für `routeIndex`.
 */
export function buildCombatLog(
  grid: DungeonGrid,
  route: PathResult,
): CombatLog | null {
  if (route.mode === 'unreachable' || !hasValidRoute(grid)) return null
  return resolveSnapshotRaid({
    grid,
    teamSize: fixture.team.length,
    monsterSlots: occupiedSlots(),
    seed: fixtureRaid.seed,
    floor: fixtureRaid.floor,
    token: fixtureRaid.jobId,
  }).log.log
}
