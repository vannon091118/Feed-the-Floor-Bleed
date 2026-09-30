import type { CombatLog } from '@floor/contracts'
import {
  baseMonsters,
  type DungeonGrid,
  hasValidRoute,
  type PathResult,
  resolveSnapshotRaid,
} from '@floor/sim-core'
import { effect } from '@preact/signals'
import { grid, route } from '../dungeon-editor/state'
import { fixture, fixtureRaid } from '../fixture-data'
import { snapshotInput } from './fixture-raid'
import { setPlaybackLog } from './playback'

/**
 * Die Basisart je Verteidiger-Slot, in der Reihenfolge, in der der Core die
 * Monster aufgebaut hat.
 *
 * Der Core zählt belegte Plätze, nicht ihre Art; die Reihenfolge der
 * belegten Slots ist deshalb genau die Reihenfolge der Kampf-Einheiten
 * `monster-0` bis `monster-4`. Eine ID, die nicht in der Registry steht, ergibt
 * `undefined` — die Einheit fällt dann auf die generische Rollentextur zurück,
 * statt eine erfundene Art zu zeigen.
 */
export function baseIdsBySlot(): (string | undefined)[] {
  return fixture.monsterSlots.map((slot) =>
    slot.monsterId && baseMonsters().some((m) => m.id === slot.monsterId)
      ? slot.monsterId
      : undefined,
  )
}

/**
 * Rechnet denselben Core-Log, den der Probelauf nutzt — rein, ohne Zustand.
 *
 * Die Auftragsantwort trägt nur die Kurzfassung; die Timeline braucht Einheiten
 * und Ereignisse. Beide Wege holen ihre Eingaben aus `snapshotInput`, also aus
 * derselben Aufstellung und demselben Seed: **ein Auftrag, zwei Aufrufer**, kein
 * zweiter Kampf und keine zweite Wahrheit über den Lauf. Der einzige Unterschied
 * ist die Etage — das Dorf zählt die gekaufte, ein eingefrorener Auftrag seine
 * eigene. Die Etage steht in der Envelope und nicht im Log, deshalb liefern
 * beide heute denselben Lauf; `test/raid-timeline.test.ts` fährt beide Wege
 * gegeneinander, damit das nicht still auseinanderläuft.
 */
export function buildCombatLog(
  current: DungeonGrid,
  path: PathResult,
): CombatLog | null {
  if (path.mode === 'unreachable' || !hasValidRoute(current)) return null
  return resolveSnapshotRaid(snapshotInput(current, fixtureRaid.floor)).log.log
}

/** Der Plan, aus dem der geladene Log stammt, plus ob ein Raid geladen ist. */
let loaded = false
let source: { grid: DungeonGrid; route: PathResult } | null = null

function publish(current: DungeonGrid, path: PathResult): CombatLog | null {
  source = { grid: current, route: path }
  const log = buildCombatLog(current, path)
  setPlaybackLog(log)
  return log
}

/**
 * Einziger Besitzer des Raid-Logs, unabhängig von der lebenden Szene.
 *
 * Der Raid lädt seinen Lauf hier, das Dorf genauso: die Timeline hängt am
 * Playback-Store, nicht an einer Pixi-Szene. `unloadRaidLog` beendet den Lauf,
 * damit der nächste Tag nicht die Karte von gestern abspielt.
 */
export function loadRaidLog(): CombatLog | null {
  loaded = true
  return publish(grid.value, route.value)
}

export function unloadRaidLog(): void {
  loaded = false
  source = null
  setPlaybackLog(null)
}

/**
 * Hält den Log mit dem Plan synchron, solange ein Raid geladen ist.
 *
 * Das Grid bleibt im Raid-Editor löschbar; ohne diesen Effekt zeigte die
 * Timeline einen Lauf, den das Grid nicht mehr beschreibt. Ohne geladenen Log
 * rechnet der Editor keinen Kampf vor — der Effekt liest nur Grid und Route.
 */
effect(() => {
  const current = grid.value
  const path = route.value
  if (!loaded) return
  if (source?.grid === current && source?.route === path) return
  publish(current, path)
})
