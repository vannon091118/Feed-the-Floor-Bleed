import { baseMonsters } from '../genome/registry'
import { monsterStats } from '../genome/stats'
import { toFixed } from '../math'
import { UNIT_BASE } from '../units'
import { bossSpec } from './boss'
import type { CombatConfig, CombatUnitSpec } from './types'

// Vorläufige, NICHT abgenommene Balancing-Werte (siehe docs/CONCEPT_REVIEW.md, [K]).
// Sie liegen bewusst zentral und sind ersetzbar, ohne die Engine umzubauen.
// Die Ausgangswerte der Einheiten stehen nicht hier, sondern in `src/units.ts`:
// `genome/stats.ts` braucht dieselben Zahlen, und als `hero` und `monster`
// hier standen, schloss sich der Importkreis `combat/rules` → `genome/stats`
// → `combat/rules`.
// Die Werte des Bosses stehen nicht hier, sondern in `boss.ts`: er ist ein
// eigenes Wesen mit eigenen Verstärkungen, kein dritter Monsterwert.
export const PROVISIONAL_RULES = {
  tickRate: 20,
  maxTicks: 1800,
  attackRange: 1,
  damageFloor: toFixed(1),
  variancePermille: 900,
  varianceSwing: 100,
  route: {
    monsterRatioStart: 500,
    monsterRatioEnd: 900,
  },
}

export function defaultCombatConfig(): CombatConfig {
  return {
    tickRate: PROVISIONAL_RULES.tickRate,
    maxTicks: PROVISIONAL_RULES.maxTicks,
    attackRange: PROVISIONAL_RULES.attackRange,
    damageFloor: PROVISIONAL_RULES.damageFloor,
    variancePermille: PROVISIONAL_RULES.variancePermille,
    varianceSwing: PROVISIONAL_RULES.varianceSwing,
  }
}

function heroSpec(index: number, routeIndex: number): CombatUnitSpec {
  const base = UNIT_BASE.hero
  return {
    id: `hero-${index}`,
    side: 'heroes',
    role: 'hero',
    maxHp: base.maxHp,
    attack: base.attack,
    defense: base.defense,
    initiative: base.initiative,
    moveCooldown: base.moveCooldown,
    attackCooldown: base.attackCooldown,
    routeIndex,
  }
}

/**
 * Ein Verteidiger-Slot, wie der eingefrorene Snapshot ihn beschreibt.
 * `baseId` ist **null** für einen leeren Platz. Vor der Verdrahtung bekam
 * jeder Slot dieselben Basiswerte — fünf Monster waren fünf Kopien.
 */
export interface DefenderSlot {
  readonly baseId: string | null
}

function monsterSpec(
  slot: number,
  routeIndex: number,
  baseId: string,
): CombatUnitSpec {
  // Eine unbekannte Art darf den Lauf nicht töten: `baseMonster` würde werfen.
  // Der Platzhalter ist eine Formsache, keine Balanceentscheidung — er trägt
  // dieselben Basiswerte wie früher und lässt eine veraltete Expedition als
  // „Wesen unbekannt" im Bild stehen, statt sie abzubrechen.
  const base = baseMonsters().find((monster) => monster.id === baseId)
  const stats = base ? monsterStats(base.elements) : UNIT_BASE.monster
  return {
    id: `monster-${slot}`,
    side: 'monsters',
    role: 'monster',
    maxHp: stats.maxHp,
    attack: stats.attack,
    defense: stats.defense,
    initiative: stats.initiative,
    moveCooldown: stats.moveCooldown,
    attackCooldown: stats.attackCooldown,
    routeIndex,
  }
}

function monsterRatio(slot: number, count: number): number {
  const start = PROVISIONAL_RULES.route.monsterRatioStart
  const end = PROVISIONAL_RULES.route.monsterRatioEnd
  if (count <= 1) return start
  return start + Math.trunc(((end - start) * slot) / (count - 1))
}

export interface BuildUnitsInput {
  teamSize: number
  /**
   * Die Verteidiger in Slot-Reihenfolge. Leere Plätze stehen als `null`
   * darin und **zählen nicht** — vorher kam hier eine bloße Anzahl an, und
   * damit war die Art Information, die der Snapshot sehr wohl trägt, schon an
   * dieser Stelle verloren. Die Anzahl ergibt sich jetzt aus der Liste.
   */
  defenders: readonly DefenderSlot[]
  routeLength: number
}

export function buildCombatUnits(input: BuildUnitsInput): CombatUnitSpec[] {
  const lastIndex = input.routeLength > 0 ? input.routeLength - 1 : 0
  const units: CombatUnitSpec[] = []
  for (let index = 0; index < input.teamSize; index += 1) {
    units.push(heroSpec(index, index < lastIndex ? index : lastIndex))
  }
  const present = input.defenders.filter(
    (defender): defender is { baseId: string } => defender.baseId !== null,
  )
  for (let slot = 0; slot < present.length; slot += 1) {
    const ratio = monsterRatio(slot, present.length)
    const routeIndex = Math.min(
      lastIndex,
      Math.trunc((lastIndex * ratio) / 1000),
    )
    units.push(monsterSpec(slot, routeIndex, present[slot].baseId))
  }
  units.push(bossSpec(lastIndex))
  return units
}
