import type { TerminalRaidJob } from '@floor/contracts'
import { signal } from '@preact/signals'
import type { Resources } from '../fixture-data'
import { fixture } from '../fixture-data'
import { BALANCE } from './balance'
import { dailyYield, type PlacedBuilding } from './economy'
import { type Phase, resolvePhaseTransition } from './phase'

/**
 * DayNightState: einziger Owner der Schleifenphase und des Dorfbestands.
 *
 * Die UI liest und schreibt nur über diesen Store. `phase` hält den
 * Schleifenzustand, `day` zählt abgeschlossene Tage hoch, `job` hält das
 * TerminalRaidJob-Ergebnis der letzten Nacht, `village` den Dorfbestand und
 * `daySettlement` die Bilanz des zuletzt abgerechneten Tages. Keine zweite
 * Phase-Wahrheit in Komponenten, kein lokaler useState neben dem Store.
 *
 * Die Lage eines platzierten Gebäudes steht hier nicht: sie ist Frage der
 * Platzierungsgeometrie in `plot` und kommt mit deren Verdrahtung dazu. Der
 * Bestand trägt Art und Ausbaustufe, weil genau das die Regeln lesen.
 */
export interface DayNightState {
  phase: Phase
  day: number
  job: TerminalRaidJob | null
  village: VillageHoldings
  daySettlement: DaySettlement | null
}

/** Der Dorfbestand: Ressourcen, platzierte Gebäude, Breite des Landes. */
export interface VillageHoldings {
  resources: Resources
  buildings: PlacedBuilding[]
  landColumns: number
}

/**
 * Die Rückkehrabrechnung: was der abgerechnete Tag gutgeschrieben hat.
 *
 * Sie nennt nur Materialien, weil nur Materialien gutschreibbar sind. Die
 * Goldseite aus besiegten Raid-Gegnern (E1) fehlt hier bewusst und ist keine
 * Lücke, die ein Platzhalter füllen könnte:
 *
 * - Die Zahl der Gegner steht in keinem Contract-Feld. `CombatSummarySchema`
 *   (`packages/contracts/src/combat-log.ts:113`) ist `.strict()` und führt
 *   keine Rostergröße, und `ResultPayloadSchema` (`protocol.ts:41`) trägt gar
 *   keinen Combat-Log. `slain` ist aus einem abgeschlossenen Auftrag nicht berechenbar.
 * - Das einzige lokal verfügbare Roster ist das des eigenen Fixtures
 *   (`monsterSlots`). Daraus eine Beute zu rechnen wäre gegenüber jedem fremden
 *   Ziel eine Lüge.
 * - Zwei Leser im Repo sind sich über `monstersAlive` uneinig:
 *   `sim-core/src/combat/summary.ts:39` zählt den Boss mit, `client/src/raid/timeline-model.ts:158`
 *   nicht. Jede Formel bräuchte also zuerst eine benannte Quelle.
 *
 * Bis `CONTRACT_VERSION 4` ein Rosterfeld führt, bleibt die Naht offen und
 * wird nicht geraten.
 */
export interface DaySettlement {
  /** Der Tag, der abgerechnet wurde — vor dem Hochzählen. */
  day: number
  /** Gutgeschriebene Materialien aus dem Werkstattertrag. */
  materials: number
}

function startVillage(): VillageHoldings {
  return {
    resources: { ...BALANCE.start.resources },
    buildings: [],
    landColumns: BALANCE.start.landColumns,
  }
}

export const dayNight = signal<DayNightState>({
  phase: 'tag',
  day: fixture.day,
  job: null,
  village: startVillage(),
  daySettlement: null,
})

/**
 * Die Tagesabrechnung als reine Rechnung über den aktuellen Dorfbestand.
 *
 * Sie schreibt nichts; sie liefert den Bestand nach der Gutschrift und den
 * Bericht dazu. Der Aufrufer entscheidet, wann ein Tag abgeschlossen ist.
 *
 * Die Gutschrift ist unbedingt: `dailyYield` ist eine Summe, und die
 * Werkstattrechnung weist eine kaputte Stufe auf 0 zurück, statt sie zu melden.
 * Genau deshalb kann hier kein `NaN` in den Bestand gelangen und keine negative
 * Stufe Materialien abbuchen — die Gutschrift muss nicht selbst prüfen.
 */
function closeDay(state: DayNightState): {
  village: VillageHoldings
  daySettlement: DaySettlement
} {
  const materials = dailyYield(state.village.buildings, BALANCE)
  return {
    village: {
      ...state.village,
      resources: {
        ...state.village.resources,
        materials: state.village.resources.materials + materials,
      },
    },
    daySettlement: { day: state.day, materials },
  }
}

/**
 * Einziger Schreibpfad auf die Phase. Übergänge laufen durch
 * `resolvePhaseTransition`; ein abgelehnter Übergang verändert nichts und
 * meldet `false`. Der Aufrufer entscheidet, ob eine Abweisung sichtbar wird.
 *
 * Dieselbe Abweisung ist auch die Idempotenz der Tagesabrechnung: gutgeschrieben
 * wird genau im Übergang `result → tag`, den die Auflösung nur ein einziges Mal
 * zulässt. Ein zweiter Versuch scheitert an derselben Phase und bucht nichts
 * erneut; der Retry-Weg `result → raid` verlässt die Ergebnisphase gar nicht
 * und rechnet deshalb nichts. Die Abrechnung hängt am Ausgang des Auftrags, nicht
 * an seinem Status — eine Niederlage, die den Tag beendet, zahlt genauso.
 */
export function setPhase(to: Phase): boolean {
  const current = dayNight.value
  const next = resolvePhaseTransition(current.phase, to)
  if (next === null) return false
  const returned = current.phase === 'result' && next === 'tag'
  const abgerechnet = returned ? closeDay(current) : null
  dayNight.value = {
    phase: next,
    day: abgerechnet ? current.day + 1 : current.day,
    job: next === 'tag' ? null : current.job,
    village: abgerechnet ? abgerechnet.village : current.village,
    daySettlement: abgerechnet
      ? abgerechnet.daySettlement
      : current.daySettlement,
  }
  return true
}

/**
 * Terminaler Fixture-Auftrag der laufenden Nacht. Nur in der Raid-Phase
 * zulässig; der Auftrag wird gespeichert, die Phase bleibt unverändert.
 */
export function recordRaidJob(job: TerminalRaidJob): boolean {
  if (dayNight.value.phase !== 'raid') return false
  dayNight.value = { ...dayNight.value, job }
  return true
}

/** Test- und Demo-Hilfe: exakt der Startzustand der Schleife. */
export function resetDayNight(): void {
  dayNight.value = {
    phase: 'tag',
    day: fixture.day,
    job: null,
    village: startVillage(),
    daySettlement: null,
  }
}
