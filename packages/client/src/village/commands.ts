import type { Resources } from '../fixture-data'
import type { BuildingKind, Cost, FrozenBalance } from './balance'
import {
  buildCost,
  canBuildWorkshop,
  type LandRejection,
  landStepCost,
  upgradeCost,
} from './economy'
import { canPlace, type PlacementRejection } from './plot'
import {
  commitVillage,
  dayNight,
  type VillageBuilding,
  villageEditable,
} from './state'

/**
 * Die Kommandos des Dorfes: die eine Stelle, an der eine Absicht des Spielers
 * auf den Bestand trifft.
 *
 * Getrennt von `economy.ts`, weil hier Zustand gelesen und geschrieben wird und
 * die Entscheidungen in einer Reihenfolge fallen: erst die Phase, dann die
 * Regel, dann die Deckung, zuletzt die Geometrie. Getrennt von `state.ts`, weil
 * der Store die Zusagen hält (Phase, kein negativer Bestand), aber keine Preise
 * kennt. Kein Kommando wirft: eine Ablehnung ist ein Ergebnis mit Grund, den die
 * Oberfläche zeigen kann.
 *
 * Nichts hier rechnet mit einer eigenen Zahl. Jeder Preis kommt aus
 * `economy.ts`, jede Grenze aus der übergebenen Config, jede Zelle aus `plot`.
 * Die Baustufe eines neuen Gebäudes ist 1 — dieser Zählungsbeginn ist keine
 * Balancegröße und steht deshalb auch nicht in `balance.ts`.
 */

/** Die linke obere Zelle, an der ein Bau beginnen soll. */
export interface BuildSite {
  x: number
  y: number
}

export type BuildResult =
  | { ok: false; reason: 'not-day-phase' }
  | { ok: false; reason: 'not-buildable' }
  | { ok: false; reason: 'worker-capacity'; capacity: number }
  | { ok: false; reason: 'not-affordable'; cost: Cost }
  | Exclude<PlacementRejection, { ok: true }>
  | { ok: true; building: VillageBuilding }

export type UpgradeResult =
  | { ok: false; reason: 'not-day-phase' }
  | { ok: false; reason: 'unknown-building'; index: number }
  | { ok: false; reason: 'above-max-level'; maxLevel: number }
  | { ok: false; reason: 'below-first-level' }
  | { ok: false; reason: 'not-affordable'; cost: number }
  | { ok: true; building: VillageBuilding }

export type LandResult =
  | { ok: false; reason: 'not-day-phase' }
  | Exclude<LandRejection, { ok: true }>
  | { ok: false; reason: 'not-affordable'; cost: Cost }
  | { ok: true; landColumns: number; cost: Cost }

/** Deckt der Bestand den Preis in beiden Währungen? */
function deckt(cost: Cost, held: Resources): boolean {
  return held.gold >= cost.gold && held.materials >= cost.materials
}

/** Der Bestand nach der Zahlung. Rechnet nur; prüft nicht — das tut der Deckungstest. */
function bezahlt(cost: Cost, held: Resources): Resources {
  return {
    gold: held.gold - cost.gold,
    materials: held.materials - cost.materials,
  }
}

/**
 * Baut ein Gebäude der Art an die angegebene Zelle.
 *
 * Die Reihenfolge der Prüfungen ist die Reihenfolge der Absagen, die der
 * Spieler zu sehen bekommt: die Phase zuerst, weil sie den ganzen Vorgang
 * ausschließt, dann die Art, dann die Arbeiterkapazität als Dorfregel, dann die
 * Geometrie und zuletzt der Preis. Erst wenn alles steht, wird der Bestand
 * geschrieben — ein abgelehnter Bau kostet nichts und hinterlässt keine Spur.
 */
export function buildBuilding(
  kind: BuildingKind,
  site: BuildSite,
  config: FrozenBalance,
): BuildResult {
  if (!villageEditable()) return { ok: false, reason: 'not-day-phase' }
  if (!config.buildings[kind].buildable)
    return { ok: false, reason: 'not-buildable' }
  const { village } = dayNight.value
  if (kind === 'workshop') {
    const capacity = canBuildWorkshop(village.buildings, config)
    if (!capacity.ok) return capacity
  }
  const { width, height } = config.buildings[kind].footprint
  const placement = canPlace(
    { ...site, width, height },
    village.buildings.map((building) => building.footprint),
    { columns: village.landColumns, rows: config.start.landRows },
  )
  if (!placement.ok) return placement
  const cost = buildCost(kind, config)
  if (!deckt(cost, village.resources))
    return { ok: false, reason: 'not-affordable', cost }
  const building: VillageBuilding = {
    kind,
    level: 1,
    footprint: { ...site, width, height },
  }
  const geschrieben = commitVillage({
    ...village,
    resources: bezahlt(cost, village.resources),
    buildings: [...village.buildings, building],
  })
  if (!geschrieben) return { ok: false, reason: 'not-day-phase' }
  return { ok: true, building }
}

/**
 * Hebt das Gebäude an der Listenstelle um genau eine Stufe.
 *
 * Eine Stelle in der Liste und keine Kennung: In diesem Slice wird nichts
 * entfernt und nichts umsortiert, eine Kennung hätte also keinen Leser. Ein
 * Index außerhalb der Liste ist eine Ablehnung mit genanntem Wert und kein
 * Wurf — die Oberfläche entscheidet, worauf der Klick zeigte.
 *
 * `below-first-level` steht im Ergebnistyp, weil eine Stufe, die keine ganze
 * Zahl ab 1 ist, aus keiner Zielstufe einen Preis machen kann. Ein korrekt
 * platziertes Gebäude hat Stufe 1; der Grund erscheint deshalb nur, wenn von
 * außen eine kaputte Stufe in den Bestand geraten ist.
 */
export function upgradeBuilding(
  index: number,
  config: FrozenBalance,
): UpgradeResult {
  if (!villageEditable()) return { ok: false, reason: 'not-day-phase' }
  const { village } = dayNight.value
  const current = village.buildings[index]
  if (!current) return { ok: false, reason: 'unknown-building', index }
  const price = upgradeCost(current.kind, current.level + 1, config)
  if (!price.ok) return price
  if (village.resources.gold < price.cost)
    return { ok: false, reason: 'not-affordable', cost: price.cost }
  const building: VillageBuilding = { ...current, level: current.level + 1 }
  const geschrieben = commitVillage({
    ...village,
    resources: {
      ...village.resources,
      gold: village.resources.gold - price.cost,
    },
    buildings: village.buildings.map((entry, position) =>
      position === index ? building : entry,
    ),
  })
  if (!geschrieben) return { ok: false, reason: 'not-day-phase' }
  return { ok: true, building }
}

/**
 * Kauft genau einen Schritt Landerweiterung.
 *
 * Ein Schritt und nicht eine Zielbreite: Der Preis hängt an der Zahl der
 * Schritte, und wer zwei kaufen will, kauft zweimal — mit der Ablehnung nach dem
 * ersten Kauf, wenn das Gold nicht reicht. Die Zielbreite rechnet sich aus der
 * Config und der aktuellen Breite; eine Zahl dafür führt der Aufrufer nicht.
 */
export function extendLand(config: FrozenBalance): LandResult {
  if (!villageEditable()) return { ok: false, reason: 'not-day-phase' }
  const { village } = dayNight.value
  const to = village.landColumns + config.land.columnsPerStep
  const price = landStepCost(village.landColumns, to, config)
  if (!price.ok) return price
  if (!deckt(price.cost, village.resources))
    return { ok: false, reason: 'not-affordable', cost: price.cost }
  const geschrieben = commitVillage({
    ...village,
    resources: bezahlt(price.cost, village.resources),
    landColumns: to,
  })
  if (!geschrieben) return { ok: false, reason: 'not-day-phase' }
  return { ok: true, landColumns: to, cost: price.cost }
}
