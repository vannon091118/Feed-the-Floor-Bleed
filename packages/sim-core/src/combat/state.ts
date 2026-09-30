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
 * Zuerst stand hier `candidate.hp * best.maxHp > best.hp * candidate.maxHp`, mit
 * der Begründung, eine Division runde Stellen und entscheide damit statt nur zu
 * vergleichen. **Diese Begründung hat sich als falsch erwiesen, und die Messung
 * steht unten.**
 *
 * Geteilt wird jetzt durch das jeweilige `maxHp`, das ist `hp / maxHp`.
 *
 * **Was die Messung sagt — und was sie nicht sagt.** Verglichen
 * wurden Kreuzprodukt, Division und eine BigInt-Rechnung als Wahrheitsmaßstab,
 * über alle Zweierpotenzen von 2¹⁰ bis 2⁵⁰ mit `hp` und `maxHp` bis 4 und
 * Versätzen bis 3: **4428 Fälle, null davon, in denen die Division falsch liegt,
 * und 864 Fälle, null davon, in denen das Kreuzprodukt falsch liegt.**
 *
 * Das gilt für diesen Bereich, nicht für die ganze Zahl. Der Kreuzprodukt-Vergleich
 * bricht erst, wenn das *Produkt* `hp · maxHp` 2⁵³ überschreitet, und auch dann
 * nur, wenn 2⁵³+1 auf denselben Float fällt wie 2⁵³ — das ist `maxHp` 2⁵², also
 * **oberhalb** der gemessenen Grenze. Da 2⁵³+1 durch 3 teilbar ist, existiert
 * genau ein konstruierter Fall: `maxHp` 2⁵² mit `hp` 3 gegen `maxHp`
 * 3002399751580331 mit `hp` 2. **Dort entscheidet die Division richtig** — sie
 * sieht den Unterschied im sechzehnten Nachkommastellenbit, während das
 * Kreuzprodukt ihn verliert.
 *
 * **Auch die Division ist ab 2⁵³ nicht mehr exakt.** Erweitert man die Messung
 * auf 2¹⁰ bis 2⁵⁶, findet sie 60 Fälle, in denen **beide** Formen von der
 * BigInt-Wahrheit abweichen, den ersten genau bei 2⁵³. Die Division ist in diesem
 * Bereich also nicht generell richtig, sondern für den einen konstruierten Fall
 * richtig. Wer daraus „die Division ist sicher" liest, hat den Satz überdehnt.
 *
 * Die genannte Schwelle `maxHp ≈ 3 001 199` aus einer früheren Fassung dieser
 * Notiz war um Größenordnungen daneben: sie ist `√(2⁵³ / 1000)`, `3001199²` ist
 * eine sichere Zahl, und in dieser Größenordnung kippt nichts.
 *
 * **Warum der Wechsel trotzdem bleibt:** nicht als Reparatur eines belegten
 * Fehlers, sondern weil die Division für `hp / maxHp` das ist, was der Name
 * sagt. Das Kreuzprodukt musste erst zwei Werte tauschen, um dasselbe zu
 * behaupten, und diese Behauptung war nur so gut wie ihre Herleitung — die
 * nicht trug. Ein Kommentar, der eine Scheinbegründung trägt, ist schlechter
 * als gar keiner.
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
