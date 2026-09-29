import { clampInt } from '../math'
import type { Genome, MonsterStats } from './types'

/**
 * Bausteine und gemeinsame Form der Effekt-Dateien.
 *
 * Die Effekte selbst sind je eine Datei (`trait-*.ts`, `bonus-*.ts`) und
 * bleiben klein; diese Helfer halten die Formeln an einer Stelle, damit etwa
 * „Verteidigung anheben" überall dieselbe Rechnung kennt. Eine eigene Datei je
 * Trait und Bonus ist verlangt, damit jede Eigenschaft für sich gelesen,
 * geprüft und getauscht werden kann.
 *
 * Ein Effekt sieht zwei Dinge: die Werte, die die Kopplung aus den Elementen
 * gerechnet hat, und das Genom selbst. Der zweite Teil ist der Grund, warum
 * `vitality` von einem leichten Wesen etwas anderes macht als von einem
 * schweren — ein Effekt, der nur die Zahlen sieht, kann die Elemente nicht
 * lesen und wäre auf einen festen Faktor festgenagelt.
 */
export interface StatsModifier {
  readonly id: string
  apply(stats: MonsterStats, genome: Genome): MonsterStats
}

/** Verteidigung in Promille anheben. */
export function bumpDefense(stats: MonsterStats, permille: number): number {
  return Math.trunc((stats.defense * (1000 + permille)) / 1000)
}

/** Angriff in Promille anheben. */
export function bumpAttack(stats: MonsterStats, permille: number): number {
  return Math.trunc((stats.attack * (1000 + permille)) / 1000)
}

/**
 * Initiative setzen, auf die Grenze des Wertebereichs begrenzt.
 *
 * Die Grenze `[100, 900]` ist die des Kerns; sie steht hier, weil drei
 * Effekte sie brauchen und sie sonst jede für sich aufschreiben müssten.
 */
export function initiative(value: number): number {
  return clampInt(value, 100, 900)
}

/**
 * Einen Cooldown verschieben.
 *
 * Die Obergrenze 9 lässt einem Effekt zwei Schritte über dem Kernmaximum [1, 6]
 * heraus; die Untergrenze 1 ist für beide dieselbe.
 */
export function shiftCooldown(value: number, delta: number): number {
  return clampInt(value + delta, 1, 9)
}

export function modifier(
  id: string,
  apply: StatsModifier['apply'],
): StatsModifier {
  return { id, apply }
}
