/**
 * Gebäudedefinitionen des Dorfes.
 *
 * Reine Daten: Was ein Gebäude kostet, welchen Ertrag es je Tag bringt, wie
 * viele Arbeiter darin arbeiten können und welchem Wert es dient. Die Regeln
 * zum Ausbauen und Abrechnen liegen in `economy.ts`, der Zustand in
 * `treasury.ts`.
 *
 * Die Zahlen sind eine Startbasis, keinbalancing: Sie sind so gewählt, dass
 * ein Lauf von Tag 18 über eine Nacht genau einen ausgebauten Baustein und
 * einen Verkauf trägt, ohne dass Gold sofort zur Neige geht.
 */
export type BuildingId = 'wohnhaus' | 'werkstatt' | 'gehege' | 'rathaus'

export interface Yield {
  gold: number
  materials: number
}

export interface BuildingDef {
  id: BuildingId
  name: string
  /** Was das Gebäude bewirkt, als Text für die Oberfläche. */
  purpose: string
  /** Gold und Material für den Bau der Stufe `level + 1`. */
  goldCost: number
  materialCost: number
  maxLevel: number
  /** Ertrag je Stufe und Tag, unabhängig von der Belegung. */
  yieldPerLevel: Yield
  /** Arbeitsplätze je Stufe. */
  workerSlotsPerLevel: number
}

export const BUILDINGS: readonly BuildingDef[] = [
  {
    id: 'wohnhaus',
    name: 'Wohnhaus',
    purpose: 'Unterkunft für zwei Arbeiter je Stufe',
    goldCost: 40,
    materialCost: 2,
    maxLevel: 3,
    yieldPerLevel: { gold: 0, materials: 0 },
    workerSlotsPerLevel: 2,
  },
  {
    id: 'werkstatt',
    name: 'Werkstatt',
    purpose: 'Materialertrag, dazu ein Goldbeitrag',
    goldCost: 55,
    materialCost: 3,
    maxLevel: 3,
    yieldPerLevel: { gold: 2, materials: 3 },
    workerSlotsPerLevel: 1,
  },
  {
    id: 'gehege',
    name: 'Gehege',
    purpose: 'Ein zusätzlicher Verteidigerplatz je Stufe',
    goldCost: 35,
    materialCost: 1,
    maxLevel: 2,
    yieldPerLevel: { gold: 1, materials: 0 },
    workerSlotsPerLevel: 1,
  },
  {
    id: 'rathaus',
    name: 'Rathaus',
    purpose: 'Hebt die Attraktivität und damit den Zuzug',
    goldCost: 80,
    materialCost: 4,
    maxLevel: 2,
    yieldPerLevel: { gold: 3, materials: 1 },
    workerSlotsPerLevel: 1,
  },
]

const BY_ID = new Map<BuildingId, BuildingDef>(
  BUILDINGS.map((entry) => [entry.id, entry]),
)

/** Die Definition zu einer Gebäude-ID. Unbekannte IDs sind ein Programmierfehler. */
export function buildingById(id: BuildingId): BuildingDef {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unbekanntes Gebäude: ${id}`)
  return found
}

/** Löhne: ein arbeitender Arbeiter kostet je Tag ein Gold. */
export const WAGE_PER_WORKER = 1
