import { absInt, clampInt, mulFixed } from '../math'
import { isBoss } from './boss'
import type {
  CombatConfig,
  CombatStage,
  CombatTrailEntry,
  CombatUnitSpec,
  CombatUnitState,
} from './types'

function startTick(initiative: number, tickRate: number): number {
  return Math.trunc(((1000 - clampInt(initiative, 0, 1000)) * tickRate) / 1000)
}

/**
 * Aus Specs werden Zustände.
 *
 * Die Zone einer Einheit kommt aus dem Trail und nicht aus dem Grid: der Trail
 * ist der einzige Ortszeuge, den `replayCombat` aus dem Log hat.
 */
export function createUnitStates(
  specs: readonly CombatUnitSpec[],
  config: CombatConfig,
  trail: readonly CombatTrailEntry[],
): CombatUnitState[] {
  return specs.map((spec) => ({
    ...spec,
    hp: spec.maxHp,
    alive: true,
    ambushAvailable: spec.ambushZoneId >= 0,
    zoneId: trail[spec.routeIndex].zoneId,
    nextActionTick: startTick(spec.initiative, config.tickRate),
  }))
}

/**
 * Das Ziel einer Einheit.
 *
 * Das ist die einzige Stelle, an der das Verhaltensprofil aus dem Genom wirkt
 * (`genome/behavior.ts`). Es ändert ausschließlich die Wahl, nie eine Zahl:
 * Helden und Monster mit `none` greifen wie zuvor das nächste Ziel an, der
 * `tank` nimmt das vollste, der `hunter` das schwächste, der `control` das
 * gefährlichste — die Initiative entscheidet darüber, wer am schnellen wieder
 * zuschlägt.
 *
 * Die Schleife läuft in Einheitenreihenfolge und entscheidet mit striktem
 * Ungleich: bei Gleichstand bleibt der zuerst gefundene stehen. Deshalb
 * liefert derselbe Kampf dieselbe Wahl, ohne dass ein zweiter Zufall oder eine
 * Division die Entscheidung tragen müsste.
 */
export function chooseOpponent(
  states: readonly CombatUnitState[],
  actor: CombatUnitState,
): CombatUnitState | undefined {
  let best: CombatUnitState | undefined
  for (const candidate of states) {
    if (!candidate.alive || candidate.side === actor.side) continue
    if (!best || prefers(actor, candidate, best)) best = candidate
  }
  return best
}

/** Schlägt der Kandidat den bisher Gewählten für dieses Verhalten? */
function prefers(
  actor: CombatUnitState,
  candidate: CombatUnitState,
  best: CombatUnitState,
): boolean {
  switch (actor.behavior) {
    case 'tank':
      return livesAhead(candidate, best)
    case 'hunter':
      return livesBehind(candidate, best)
    case 'control':
      return candidate.initiative > best.initiative
    default:
      // `none` und jeder unbekannte Wert sind dieselbe Wahl: das nächste Ziel —
      // die Regel, die vor diesem Slice für alle galt. Der Grundfall ist
      // zugleich der Rückfall, damit ein unbekanntes Profil die Entscheidung
      // nicht erfindet, sondern dieselbe trifft wie vorher.
      return distanceBetween(actor, candidate) < distanceBetween(actor, best)
  }
}

/**
 * Höheres Lebensverhältnis, ohne Kreuzprodukt.
 *
 * Zuerst stand hier `candidate.hp * best.maxHp > best.hp * candidate.maxHp`. Der
 * Vergleich ist mathematisch richtig und praktisch eine Zeitbombe: `Number`
 * verliert ab 2⁵³ genau, das heißt zwei Zahlen um je 9 007 199 254 740 992
 * werden als gleich groß behandelt. Ab `maxHp ≈ 3 001 199` entschied der Kampf
 * in diesem Vergleich also nicht mehr das Leben, sondern die Rundung.
 *
 * Geteilt wird durch das jeweilige `maxHp`, das ist `hp / maxHp` — dieselbe
 * Größe, die verglichen werden soll, ohne Nebenwirkung. Die alte Fassung
 * wollte die Rundung vermeiden, hat sie aber nicht vermieden, nur verlegt.
 */
function livesAhead(
  candidate: CombatUnitState,
  best: CombatUnitState,
): boolean {
  return candidate.hp / candidate.maxHp > best.hp / best.maxHp
}

/** Niedrigeres Lebensverhältnis — derselbe Vergleich, nur umgekehrt. */
function livesBehind(
  candidate: CombatUnitState,
  best: CombatUnitState,
): boolean {
  return candidate.hp / candidate.maxHp < best.hp / best.maxHp
}

/** Abstand auf der Route, in Schritten. */
export function distanceBetween(
  left: CombatUnitSpec,
  right: CombatUnitSpec,
): number {
  return absInt(left.routeIndex - right.routeIndex)
}

export function damageFor(
  actor: CombatUnitState,
  target: CombatUnitState,
  variancePermille: number,
  config: CombatConfig,
): number {
  const base = actor.attack - target.defense
  const varied = mulFixed(base > 0 ? base : 0, variancePermille)
  return varied > config.damageFloor ? varied : config.damageFloor
}

export function evaluateStage(
  states: readonly CombatUnitState[],
  ticks: number,
  config: CombatConfig,
): CombatStage | 'running' {
  const boss = states.find(isBoss)
  if (!boss?.alive) return 'heroes-win'
  const heroesAlive = states.some(
    (unit) => unit.side === 'heroes' && unit.alive,
  )
  if (!heroesAlive) return 'monsters-win'
  if (ticks >= config.maxTicks) return 'timeout'
  return 'running'
}
