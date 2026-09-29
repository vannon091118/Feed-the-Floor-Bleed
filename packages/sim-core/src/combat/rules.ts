import { baseMonsters } from '../genome/registry'
import { monsterStats } from '../genome/stats'
import { GRID_SIZE } from '../grid'
import { toFixed } from '../math'
import { UNIT_BASE } from '../units'
import { bossSpec } from './boss'
import type { CombatConfig, CombatTrailEntry, CombatUnitSpec } from './types'

// Vorläufige, NICHT abgenommene Balancing-Werte (siehe docs/CONCEPT_REVIEW.md, [K]).
export const PROVISIONAL_RULES = {
  tickRate: 20,
  maxTicks: 1800,
  attackRange: 1,
  damageFloor: toFixed(1),
  variancePermille: 900,
  varianceSwing: 100,
  // [K] 25 % Rüstungsdurchdringung beim ersten Angriff eines aufgestellten
  // Verteidigers; steht das Ziel in dessen Lauerzone, ist die Lauer entdeckt
  ambushDefensePenetrationPermille: 250,
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

function heroSpec(index: number, trailIndex: number): CombatUnitSpec {
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
    routeIndex: trailIndex,
    ambushZoneId: -1,
  }
}

export interface DefenderSlot {
  readonly baseId: string | null
}

/**
 * Ein Verteidiger auf seinem Platz der Route.
 *
 * `zoneId` ist die Zone der Platzierungsgruppe, zu der der Slot gehört, sonst
 * `-1`. Eine unbekannte Art darf den Lauf nicht töten: `baseMonster` würde
 * werfen. Der Platzhalter ist eine Formsache, keine Balanceentscheidung — er
 * trägt die Basiswerte und lässt eine veraltete Expedition als „Wesen
 * unbekannt“ im Bild stehen, statt sie abzubrechen.
 */
function monsterSpec(
  slot: number,
  trailIndex: number,
  zoneId: number,
  baseId: string,
): CombatUnitSpec {
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
    routeIndex: trailIndex,
    ambushZoneId: zoneId,
  }
}

export interface BuildUnitsInput {
  teamSize: number
  defenders: readonly DefenderSlot[]
  trail: readonly CombatTrailEntry[]
  /**
   * Die Platzierungsgruppen des Dungeons in Rasterreihenfolge, aus
   * `classifyDungeonZones`. Sie sind die Zonenform, aus der ein Verteidiger
   * seinen Hinterhalt bekommt; ohne sie fällt die Aufstellung auf eine
   * gleichmäßige Verteilung über die Route zurück.
   */
  placements: readonly (readonly number[])[]
  /** Zonen-ID je Gruppe aus `placements`, in derselben Reihenfolge. */
  placementZoneIds: readonly number[]
}

/**
 * Route-Index, der einer Platzierungsgruppe am nächsten liegt.
 *
 * Gerechnet wird über den Schwerpunkt der Gruppe: sie darf mehrere Zellen
 * breit sein, und eine einzelne ihrer Zellen als Aufstellungsort zu nehmen
 * hinge dann an der Scanreihenfolge.
 */
function nearestTrailIndex(
  cells: readonly number[],
  trail: readonly CombatTrailEntry[],
): number {
  let centerX = 0
  let centerY = 0
  for (const cell of cells) {
    centerX += cell % GRID_SIZE
    centerY += Math.floor(cell / GRID_SIZE)
  }
  centerX = Math.floor(centerX / cells.length)
  centerY = Math.floor(centerY / cells.length)
  let best = 0
  let distance = Number.MAX_SAFE_INTEGER
  for (let index = 0; index < trail.length; index += 1) {
    const next =
      Math.abs(trail[index].x - centerX) + Math.abs(trail[index].y - centerY)
    if (next < distance) {
      best = index
      distance = next
    }
  }
  return best
}

/**
 * Die Einheiten eines Laufs: Helden vorne, Verteidiger in ihren
 * Platzierungsgruppen, der Boss am Routenende.
 *
 * Eine Platzierungsgruppe bindet einen Slot an ihren Ort; ohne Gruppe verteilt
 * der Rückfall die Verteidiger gleichmäßig über die Route. Der Boss steht am
 * Routenende, denn er ist die Bedingung des Heldensiegs.
 */
export function buildCombatUnits(input: BuildUnitsInput): CombatUnitSpec[] {
  const lastIndex = input.trail.length - 1
  const units: CombatUnitSpec[] = []
  for (let index = 0; index < input.teamSize; index += 1) {
    units.push(heroSpec(index, Math.min(index, lastIndex)))
  }
  const present = input.defenders.filter(
    (defender): defender is { baseId: string } => defender.baseId !== null,
  )
  for (let slot = 0; slot < present.length; slot += 1) {
    const placement = input.placements[slot]
    const trailIndex = placement
      ? nearestTrailIndex(placement, input.trail)
      : Math.min(
          lastIndex,
          Math.trunc((lastIndex * (slot + 1)) / (present.length + 1)),
        )
    const zoneId = placement ? (input.placementZoneIds[slot] ?? -1) : -1
    units.push(monsterSpec(slot, trailIndex, zoneId, present[slot].baseId))
  }
  units.push(bossSpec(lastIndex))
  return units
}
