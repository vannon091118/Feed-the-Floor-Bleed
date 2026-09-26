import { fixture } from '../fixture-data'
import {
  BUILDINGS,
  type BuildingId,
  WAGE_PER_WORKER,
  type Yield,
  buildingById,
} from './buildings'

/** Wie das Dorf belegt ist. Kein Spielzustand, nur die Belegung. */
export interface VillageHoldings {
  gold: number
  materials: number
  workers: number
  /** Stufe je Gebäude-ID; fehlt eine ID, steht das Gebäude auf 0. */
  levels: Partial<Record<BuildingId, number>>
  /** Zugewiesene Arbeiter je Gebäude-ID. */
  assignments: Partial<Record<BuildingId, number>>
}

/** Kosten der nächsten Stufe. Der Aufschlag je Stufe ist linear. */
export function upgradeCost(id: BuildingId, level: number): Yield {
  const def = buildingById(id)
  return {
    gold: def.goldCost * (level + 1),
    materials: def.materialCost * (level + 1),
  }
}

/** Reicht der Vorrat für einen Ausbau? Rückgabe nennt auch den Fehlbetrag. */
export function canAfford(
  holdings: VillageHoldings,
  id: BuildingId,
): { ok: boolean; missing: Yield; cost: Yield } {
  const level = holdings.levels[id] ?? 0
  const cost = upgradeCost(id, level)
  const missing = {
    gold: Math.max(0, cost.gold - holdings.gold),
    materials: Math.max(0, cost.materials - holdings.materials),
  }
  return { ok: missing.gold === 0 && missing.materials === 0, missing, cost }
}

/** Stufe eines Gebäudes, fehlende IDs zählen als nicht gebaut. */
export function levelOf(holdings: VillageHoldings, id: BuildingId): number {
  return holdings.levels[id] ?? 0
}

/** Arbeitsplätze eines Gebäudes auf seiner aktuellen Stufe. */
export function workerSlotsOf(
  holdings: VillageHoldings,
  id: BuildingId,
): number {
  return buildingById(id).workerSlotsPerLevel * levelOf(holdings, id)
}

/**
 * Wie viele Arbeiter das Dorf überhaupt beschäftigen kann.
 *
 * Grundlage ist die Startbasis aus den Fixture-Daten; jedes Wohnhaus
 * erweitert die Unterkunft um zwei Plätze. Die Arbeitsplätze der Gebäude
 * begrenzen zusätzlich, nicht die Gesamtzahl.
 */
export function workerCapacity(holdings: VillageHoldings): number {
  let capacity = fixture.workers
  for (const def of ['wohnhaus'] as const) {
    capacity += workerSlotsOf(holdings, def)
  }
  return capacity
}

/** Arbeitsplätze über alle Gebäude, also wie viele Arbeiter zugewiesen sein dürfen. */
export function totalWorkerSlots(holdings: VillageHoldings): number {
  return (['wohnhaus', 'werkstatt', 'gehege', 'rathaus'] as const).reduce(
    (sum, id) => sum + workerSlotsOf(holdings, id),
    0,
  )
}

/** Zugewiesene Arbeiter über alle Gebäude. */
export function assignedWorkers(holdings: VillageHoldings): number {
  return (['wohnhaus', 'werkstatt', 'gehege', 'rathaus'] as const).reduce(
    (sum, id) => sum + (holdings.assignments[id] ?? 0),
    0,
  )
}

/** Ertrag aller Gebäude am Tag, unabhängig von der Belegung. */
export function dailyYield(holdings: VillageHoldings): Yield {
  const out: Yield = { gold: 0, materials: 0 }
  for (const def of BUILDINGS) {
    const level = levelOf(holdings, def.id)
    out.gold += def.yieldPerLevel.gold * level
    out.materials += def.yieldPerLevel.materials * level
  }
  return out
}

/** Löhne am Tag: ein Gold je zugewiesenem Arbeiter. */
export function dailyWages(holdings: VillageHoldings): Yield {
  return { gold: assignedWorkers(holdings) * WAGE_PER_WORKER, materials: 0 }
}

/** Die Attraktivität als Basis plus der Beitrag des Rathauses. */
export function attractiveness(holdings: VillageHoldings): number {
  return fixture.attractiveness + levelOf(holdings, 'rathaus') * 6
}

/**
 * Zuzug je Tag aus der Attraktivität.
 *
 * Ab fünfzig Punkten kommt alle zehn Punkte ein Arbeiter ins Dorf, gedeckelt
 * durch die freie Unterkunft. Damit ist der Rathaus-Ausbau die einzige Stellschraube
 * für den Zuzug, und der Zuzug ist an eine reale Kapazität gebunden.
 */
export function dailyRecruits(
  holdings: VillageHoldings,
  freeCapacity: number,
): number {
  const score = attractiveness(holdings)
  if (score < 50) return 0
  const wanted = Math.floor((score - 50) / 10)
  return Math.max(0, Math.min(wanted, freeCapacity))
}

/** Das Ergebnis eines Tages: Ertrag minus Löhne, danach der Zuzug. */
export interface DayReport {
  gold: number
  materials: number
  wages: number
  recruits: number
}

/**
 * Rechnet einen Tag ab und liefert den Bericht, ohne etwas zu ändern.
 *
 * Die Funktion ist rein: gleiche Belegung, gleiches Ergebnis. Die Anwendung
 * auf den Store liegt in `treasury.ts`.
 */
export function settleDay(
  holdings: VillageHoldings,
  freeCapacity: number,
): DayReport {
  const income = dailyYield(holdings)
  const wages = dailyWages(holdings).gold
  return {
    gold: income.gold - wages,
    materials: income.materials,
    wages,
    recruits: dailyRecruits(holdings, freeCapacity),
  }
}
