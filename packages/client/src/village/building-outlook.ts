import { fixture } from '../fixture-data'
import type { BuildingId } from './buildings'
import { BUILDINGS } from './buildings'
import type { VillageState } from './treasury'

/** Ein Gebäude samt der Zahlen, die Bauen, Ertrag und Belegung erklären. */
export interface BuildingOutlook {
  id: BuildingId
  name: string
  purpose: string
  level: number
  maxLevel: number
  built: boolean
  assigned: number
  slots: number
  yieldGold: number
  yieldMaterials: number
  goldCost: number
  materialCost: number
  affordable: boolean
  /** Fehlbetrag als Text, leer wenn der Bau bezahlbar ist. */
  missing: string
}

/** Wie viele Verteidigerplätze das Dorf anbietet, inklusive Gehege-Ausbau. */
export function defenderSlots(state: VillageState): number {
  return fixture.monsterSlots.length + (state.levels.gehege ?? 0)
}

function shortfall(
  state: VillageState,
  goldCost: number,
  materialCost: number,
): string {
  if (state.gold >= goldCost && state.materials >= materialCost) return ''
  return [
    state.gold < goldCost ? `${goldCost - state.gold} Gold` : null,
    state.materials < materialCost
      ? `${materialCost - state.materials} Material`
      : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' und ')
}

/**
 * Beschreibt jedes Gebäude mit den Zahlen, die eine Bauentscheidung tragen.
 *
 * Reine Ableitung über den Wirtschafts-Store: Stufe, Ertrag, belegte und
 * freie Arbeitsplätze, Kosten der nächsten Stufe und der Fehlbetrag. Die
 * Oberfläche rechnet daraus nichts selbst.
 */
export function buildingOutlooks(state: VillageState): BuildingOutlook[] {
  return BUILDINGS.map((def) => {
    const level = state.levels[def.id] ?? 0
    const goldCost = def.goldCost * (level + 1)
    const materialCost = def.materialCost * (level + 1)
    return {
      id: def.id,
      name: def.name,
      purpose: def.purpose,
      level,
      maxLevel: def.maxLevel,
      built: level > 0,
      assigned: state.assignments[def.id] ?? 0,
      slots: def.workerSlotsPerLevel * level,
      yieldGold: def.yieldPerLevel.gold * level,
      yieldMaterials: def.yieldPerLevel.materials * level,
      goldCost,
      materialCost,
      affordable: state.gold >= goldCost && state.materials >= materialCost,
      missing: shortfall(state, goldCost, materialCost),
    }
  })
}
