import { ROSTER_A } from './roster-a'
import { ROSTER_B } from './roster-b'
import {
  ARCHETYPE_IDS,
  type BaseMonster,
  BONUS_IDS,
  ELEMENT_MAX,
  ELEMENT_MIN,
  TRAIT_IDS,
} from './types'

/**
 * Die Registry ist der einzige Ort, an dem ein Basis-Monster nachgeschlagen wird.
 *
 * Sie führt die beiden Roster-Listen zusammen und hält die Invarianten des
 * Pools. Die Prüfung läuft beim Modulladen, nicht beim Aufruf: ein Pool, der
 * seine eigenen Regeln bricht, darf den Kampf nicht erreichen.
 */
const ROSTER: readonly BaseMonster[] = [...ROSTER_A, ...ROSTER_B]

const BY_ID = new Map(ROSTER.map((monster) => [monster.id, monster]))

function assertRoster(): void {
  const traits = new Set<string>(TRAIT_IDS)
  const bonuses = new Set<string>(BONUS_IDS)
  const archetypes = new Set<string>(ARCHETYPE_IDS)
  if (BY_ID.size !== ROSTER.length) {
    throw new Error('genome: doppelte Monster-ID im Pool')
  }
  for (const monster of ROSTER) {
    if (monster.elements.length !== 3) {
      throw new Error(`genome: ${monster.id} hat nicht drei Elemente`)
    }
    for (const element of monster.elements) {
      if (
        !Number.isInteger(element) ||
        element < ELEMENT_MIN ||
        element > ELEMENT_MAX
      ) {
        throw new Error(`genome: ${monster.id} Element ${element} außerhalb`)
      }
    }
    if (!traits.has(monster.trait)) {
      throw new Error(`genome: ${monster.id} trägt unbekanntes Trait`)
    }
    if (!bonuses.has(monster.bonus)) {
      throw new Error(`genome: ${monster.id} trägt unbekannten Bonus`)
    }
    if (!archetypes.has(monster.archetype)) {
      throw new Error(`genome: ${monster.id} trägt unbekannten Archetyp`)
    }
  }
}

assertRoster()

/** Alle Basis-Monster in fester Registry-Reihenfolge. */
export function baseMonsters(): readonly BaseMonster[] {
  return ROSTER
}

/** Das Basis-Monster zu einer ID. Wirft, wenn die ID nicht im Pool steht. */
export function baseMonster(id: string): BaseMonster {
  const monster = BY_ID.get(id)
  if (!monster) throw new Error(`genome: unbekanntes Basis-Monster ${id}`)
  return monster
}
