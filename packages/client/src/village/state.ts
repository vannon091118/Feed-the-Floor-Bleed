import type { TerminalRaidJob } from '@floor/contracts'
import { signal } from '@preact/signals'
import type { Resources } from '../fixture-data'
import { fixture } from '../fixture-data'
import { BALANCE } from './balance'
import { dailyYield, type PlacedBuilding } from './economy'
import { type Phase, resolvePhaseTransition } from './phase'
import type { Footprint } from './plot'

/**
 * DayNightState: einziger Owner der Schleifenphase und des Dorfbestands.
 *
 * Die UI liest und schreibt nur über diesen Store. `phase` hält den
 * Schleifenzustand, `day` zählt abgeschlossene Tage hoch, `job` hält das
 * TerminalRaidJob-Ergebnis der letzten Nacht, `village` den Dorfbestand und
 * `daySettlement` die Bilanz des zuletzt abgerechneten Tages. Keine zweite
 * Phase-Wahrheit in Komponenten, kein lokaler useState neben dem Store.
 *
 * Ein Gebäude trägt seit den Baukommandos auch seinen Grundriss: Die
 * Platzierungsprüfung in `plot` braucht die belegten Zellen, und ein zweiter
 * Ort für dieselbe Lage wäre eine zweite Wahrheit. Die Weltkoordinaten der
 * Szene bleiben davon getrennt.
 */
export interface DayNightState {
  phase: Phase
  day: number
  job: TerminalRaidJob | null
  village: VillageHoldings
  daySettlement: DaySettlement | null
}

/**
 * Ein Gebäude des Dorfes: Art, Stufe und belegter Grundriss.
 *
 * Die Liste führt seit dem 2026-09-29 auch die beiden festen Startorte. Sie
 * werden nie gebaut und stehen trotzdem hier, weil die Platzierungsprüfung der
 * Baukommandos gegen genau diese Liste läuft: Ein Rathaus, das nur in der
 * Config steht, wäre gegen Überbauung ungeschützt.
 *
 * Nicht zu verwechseln mit dem gleichnamigen Präsentationsort in
 * `render/village-layout.ts`: jener liegt in Weltpixeln, dieser in
 * Rasterzellen. Die Regeln (`dailyYield`, `workerBase`) lesen Art und Stufe
 * strukturell aus `PlacedBuilding` heraus, das hier erweitert wird.
 */
export interface VillageBuilding extends PlacedBuilding {
  footprint: Footprint
}

/**
 * Der Dorfbestand: Ressourcen, platzierte Gebäude, Breite des Landes und die
 * ausgebauten Etagen der Expedition.
 */
export interface VillageHoldings {
  resources: Resources
  buildings: VillageBuilding[]
  landColumns: number
  /**
   * Ausgebaute Etagen; Etage 1 gehört zum Ausgang, die erste kaufbare steht in
   * der Config als `firstPaidFloor`. Die 1 ist wie die Baustufe eines Gebäudes
   * ein Zählungsbeginn und keine Balancegröße.
   */
  floors: number
}

/**
 * Die Rückkehrabrechnung: was der abgerechnete Tag gutgeschrieben hat.
 *
 * Sie nennt nur Materialien, weil nur Materialien gutschreibbar sind. Die
 * Goldseite aus besiegten Raid-Gegnern (E1) fehlt hier bewusst und ist keine
 * Lücke, die ein Platzhalter füllen könnte:
 *
 * - Die Stärke-/Generations-Goldformel selbst ist nicht freigegeben (`[K]` in
 *   `docs/VISUAL_GRUNDSATZ.md`). Sie hier zu erfinden wäre keine Ableitung,
 *   sondern eine Annahme.
 * - Das einzige lokal verfügbare Roster ist das des eigenen Fixtures
 *   (`monsterSlots`). Daraus eine Beute zu rechnen wäre gegenüber jedem fremden
 *   Ziel eine Lüge.
 *
 * Die Überlebendenzahlen haben seit dem Boss-Slice eine einzige Quelle:
 * `sim-core/src/combat/summary.ts` legt fest, dass `monstersAlive` ohne den
 * Boss zählt und `bossAlive` ein eigenes Feld ist; der frühere Widerspruch
 * zwischen Core und Timeline ist damit behoben. Seit Contract v4 trägt die
 * Summary außerdem `defendersTotal`, den eingefrorenen Verteidiger-Roster —
 * die Zahl der gefallenen Gegner ist damit ohne den Log berechenbar. Blockiert
 * ist die Formelfreigabe; ob die Formel nach E1 über diese Zahl hinaus Stärke
 * und Generation je Gegner braucht, führt kein Schema und ist offen.
 */
export interface DaySettlement {
  /** Der Tag, der abgerechnet wurde — vor dem Hochzählen. */
  day: number
  /** Gutgeschriebene Materialien aus dem Werkstattertrag. */
  materials: number
}

/**
 * Der Startbestand des Dorfes.
 *
 * Ressourcen und Landbreite kommen aus der Config, und die beiden festen
 * Startorte werden aus ihr angelegt statt gebaut: Art und Zelle stehen unter
 * `start.fixedSites`, die Maße kommen aus dem Grundriss derselben Art. So gibt
 * es genau eine Quelle für beide Zahlen und keinen zweiten Ort, an dem ein
 * Rathaus entstehen könnte.
 *
 * Stufe 1 ist der Zählungsbeginn jedes Gebäudes und keine Balancegröße. Die
 * Config weist einen Ausbau mit `maxLevel: 1` ab, und weil die beiden festen
 * Arten weder Wohnhaus noch Werkstatt sind, ändern sie weder Arbeiterbasis noch
 * Werkstattertrag.
 */
function startVillage(): VillageHoldings {
  return {
    resources: { ...BALANCE.start.resources },
    buildings: BALANCE.start.fixedSites.map((site) => ({
      kind: site.kind,
      level: 1,
      footprint: {
        x: site.x,
        y: site.y,
        ...BALANCE.buildings[site.kind].footprint,
      },
    })),
    landColumns: BALANCE.start.landColumns,
    floors: 1,
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
 * Ist der Dorfbestand gerade veränderbar? Nur am Tag: In Nacht, Raid und
 * Ergebnis steht der Plan, ausgegeben und gebaut wird am Tag.
 */
export function villageEditable(): boolean {
  return dayNight.value.phase === 'tag'
}

/** Ein Bestandsbetrag ist ganzzahlig und nicht negativ; `NaN` fällt heraus. */
function istBestandswert(wert: number): boolean {
  return Number.isInteger(wert) && wert >= 0
}

/**
 * Der Schreibpfad der Bau-, Ausbau- und Landkommandos.
 *
 * Die Preise und Grenzen liegen in `economy.ts`, die Entscheidung in
 * `commands.ts`; hier stehen allein die Zusagen, die für **jeden** Schreibzugriff
 * auf den Dorfbestand gelten müssen: nur am Tag, kein negativer und kein
 * gebrochener Betrag, kein Raster unter der Startbreite und keine Etage unter
 * der Ausgangsetage. Eine Ablehnung
 * verändert nichts und meldet `false` — dieselbe Form wie `setPhase`.
 *
 * Warum überhaupt eine zweite Schreibstelle neben `setPhase`: Die
 * Tagesabrechnung hängt am Übergang `result → tag` und muss mit dem Hochzählen
 * des Tages in einem Zug geschrieben werden. Die Kommandos laufen dagegen
 * ausschließlich am Tag. Über die Phase schließen sich beide Wege deshalb
 * gegenseitig aus, und einen dritten gibt es nicht.
 */
export function commitVillage(next: VillageHoldings): boolean {
  if (!villageEditable()) return false
  if (!istBestandswert(next.resources.gold)) return false
  if (!istBestandswert(next.resources.materials)) return false
  if (
    !Number.isInteger(next.landColumns) ||
    next.landColumns < BALANCE.start.landColumns
  )
    return false
  if (!Number.isInteger(next.floors) || next.floors < 1) return false
  dayNight.value = { ...dayNight.value, village: next }
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
