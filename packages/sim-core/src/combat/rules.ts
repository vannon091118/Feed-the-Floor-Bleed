import { toFixed } from '../math'
import { bossSpec } from './boss'
import type { CombatConfig, CombatUnitSpec } from './types'

// Vorläufige, NICHT abgenommene Balancing-Werte (siehe docs/CONCEPT_REVIEW.md, [K]).
// Sie liegen bewusst zentral und sind ersetzbar, ohne die Engine umzubauen.
// Die Werte des Bosses stehen nicht hier, sondern in `boss.ts`: er ist ein
// eigenes Wesen mit eigenen Verstärkungen, kein dritter Monsterwert.
export const PROVISIONAL_RULES = {
  tickRate: 20,
  maxTicks: 1800,
  attackRange: 1,
  damageFloor: toFixed(1),
  variancePermille: 900,
  varianceSwing: 100,
  hero: {
    maxHp: toFixed(60),
    attack: toFixed(12),
    defense: toFixed(3),
    initiative: 500,
    moveCooldown: 2,
    attackCooldown: 3,
  },
  monster: {
    maxHp: toFixed(40),
    attack: toFixed(8),
    defense: toFixed(2),
    initiative: 300,
    moveCooldown: 3,
    attackCooldown: 4,
  },
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
  const base = PROVISIONAL_RULES.hero
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

function monsterSpec(slot: number, routeIndex: number): CombatUnitSpec {
  const base = PROVISIONAL_RULES.monster
  return {
    id: `monster-${slot}`,
    side: 'monsters',
    role: 'monster',
    maxHp: base.maxHp,
    attack: base.attack,
    defense: base.defense,
    initiative: base.initiative,
    moveCooldown: base.moveCooldown,
    attackCooldown: base.attackCooldown,
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
  monsterSlots: number
  routeLength: number
}

export function buildCombatUnits(input: BuildUnitsInput): CombatUnitSpec[] {
  const lastIndex = input.routeLength > 0 ? input.routeLength - 1 : 0
  const units: CombatUnitSpec[] = []
  for (let index = 0; index < input.teamSize; index += 1) {
    units.push(heroSpec(index, index < lastIndex ? index : lastIndex))
  }
  for (let slot = 0; slot < input.monsterSlots; slot += 1) {
    const ratio = monsterRatio(slot, input.monsterSlots)
    const routeIndex = Math.min(
      lastIndex,
      Math.trunc((lastIndex * ratio) / 1000),
    )
    units.push(monsterSpec(slot, routeIndex))
  }
  units.push(bossSpec(lastIndex))
  return units
}
