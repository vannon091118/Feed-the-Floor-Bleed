import type { TerminalRaidJob } from '@floor/contracts'
import { signal } from '@preact/signals'
import type { MonsterSlot, Resources } from '../fixture-data'
import { fixture } from '../fixture-data'
import { BALANCE } from './balance'
import { dailyYield, type PlacedBuilding } from './economy'
import { type FallenOpponent, goldForRun } from './loot'
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
  /**
   * Die Monster, die der Spieler auf die Plätze gestellt hat.
   *
   * Das Feld trug keinen Platz im Bestand, obwohl der Wunsch im Datenmodell
   * stand: `MonsterSlot` und `slotBase` gaben die Form vor, der Spielerpfad las
   * aber `fixture.monsterSlots`, also eine Konstante. Damit war die Wahl eine
   * Eingabe ohne Ausgabe. Ein `null` ist ein freier Platz und kein leerer
   * Platz: Die Zahl der Plätze kommt aus der Etage, nicht aus diesem Feld.
   */
  monsterSlots: MonsterSlot[]
}

/**
 * Die Rückkehrabrechnung: was der abgerechnete Tag gutgeschrieben hat.
 *
 * Sie hat zwei Quellen, weil der Tag zwei Dinge einnimmt: den Werkstattertrag
 * aus den Gebäuden (Material) und die Beute des beendeten Laufs (Gold). Die
 * Goldformel ist freigegeben und steht in `village/loot.ts`; die Gegner, über
 * die sie summiert, kommen aus dem geladenen Log, nicht aus diesem Store —
 * `raid/loot-source.ts` ist ihre Ableitung und liest den eingefrorenen Slot.
 *
 * Diese beiden Zahlen sind der ganze Bericht. Eine Bilanz, die nur nennt, was
 * gerade günstig war, wäre eine zweite Erzählung neben dem Bestand.
 *
 * Die Überlebendenzahlen haben seit dem Boss-Slice eine einzige Quelle:
 * `sim-core/src/combat/summary.ts` legt fest, dass `monstersAlive` ohne den
 * Boss zählt und `bossAlive` ein eigenes Feld ist; der frühere Widerspruch
 * zwischen Core und Timeline ist damit behoben. Für die Beute werden sie nicht
 * gebraucht: wer gefallen ist, steht als Todesereignis im Log, und die
 * Identität des Gefallenen braucht die Formel — eine Anzahl allein könnte zwei
 * Gegner verschiedener Stärke nicht auseinanderhalten.
 */
export interface DaySettlement {
  /** Der Tag, der abgerechnet wurde — vor dem Hochzählen. */
  day: number
  /** Gutgeschriebenes Gold aus den gefallenen Gegnern des Laufs. */
  gold: number
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
    monsterSlots: fixture.monsterSlots.map((slot) => ({ ...slot })),
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
function closeDay(
  state: DayNightState,
  fallen: readonly FallenOpponent[],
): {
  village: VillageHoldings
  daySettlement: DaySettlement
} {
  const materials = dailyYield(state.village.buildings, BALANCE)
  const loot = goldForRun(fallen, BALANCE)
  // Ein abgewiesener Gegner macht den **ganzen** Run ungültig (`loot.ts`) und
  // nicht nur seinen Anteil: eine halbe Beute, die wie eine ganze aussieht,
  // wäre im Bestand nicht mehr von einer echten zu unterscheiden. Ein
  // ungültiger Lauf bucht deshalb nichts und nicht weniger.
  const gold = loot.ok ? loot.gold : 0
  return {
    village: {
      ...state.village,
      resources: {
        ...state.village.resources,
        gold: state.village.resources.gold + gold,
        materials: state.village.resources.materials + materials,
      },
    },
    daySettlement: { day: state.day, gold, materials },
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
 *
 * `fallen` ist die Beute des beendeten Laufs und nur für diesen einen Übergang
 * von Bedeutung. Fehlt sie dort, wird der Übergang **abgewiesen**: ein Tag, der
 * ohne seine Beute schließt, buchte still 0 Gold, und der Unterschied zu „es
 * ist nichts gefallen" wäre an keiner Stelle sichtbar. Eine leere Liste ist
 * dagegen eine gültige Aussage über den Lauf.
 */
export function setPhase(
  to: Phase,
  fallen?: readonly FallenOpponent[],
): boolean {
  const current = dayNight.value
  const next = resolvePhaseTransition(current.phase, to)
  if (next === null) return false
  const returned = current.phase === 'result' && next === 'tag'
  if (returned && fallen === undefined) return false
  const abgerechnet = returned ? closeDay(current, fallen ?? []) : null
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
