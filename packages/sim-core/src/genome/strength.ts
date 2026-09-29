import type { BaseMonster, Genome } from './types'

/**
 * Die Stärke einer Basis-Art, 0 bis 5 — die zweite Eingabe der Goldformel.
 *
 * **Was sie ist:** ein Gütemaß, kein Kampf mess. Sie beantwortet „wie viel ist
 * dieses Wesen wert", nicht „wie viele Trefferpunkte hat es gerade". Die
 * Goldformel in `docs/GOLDFORMEL.md` braucht sie, die Mutation erhöht die
 * Generation. Beides sind Größen, die der Spieler am Bestand ablesen kann.
 *
 * **Woher sie kommt:** aus dem Elementbudget der Art, also der Summe ihrer
 * drei Elemente. Nicht aus den abgeleiteten Kampfwerten — und das ist
 * gemessen, nicht behauptet: die zwanzig Arten liegen in `maxHp + attack +
 * defense` zwischen 51561 und 54816, also in gut sechs Prozent. Eine Skala aus
 * diesen Werten würde Rauschen in Stufen gießen, und die Grenzen müssten bei
 * jeder Änderung an `PROVISIONAL_RULES.monster` mitwandern. Das Elementbudget
 * dagegen liegt zwischen 9500 und 21900 und trennt die Arten wirklich.
 *
 * **Die Schwellen sind `[K]` und stehen hier.** Sie sind keine Rundungszahlen,
 * sondern die Lücken der gemessenen Verteilung: 9500/10500/10600, dann ein
 * Sprung auf 12700, dann der dichte Block 14100–15800, dann 17100–18000, dann
 * 19000 und 21900. Jede Schwelle liegt in einer Lücke, keine Art sitzt genau
 * auf ihr, und gleiche Budgets landen garantiert in derselben Stufe — sonst
 * hinge eine Stufe davon ab, wie man zwei gleiche Zahlen sortiert.
 *
 * Die Verteilung über die zwanzig Arten ist 3/2/4/5/4/2. Sie ist ungerade, weil
 * die Budgets ungerade verteilt sind; jede Stufe ist besetzt, und die unteren
 * und oberen Ränder tragen je zwei bis drei Arten.
 */

/** Die Stärkestufen. Sechs Werte, weil die Beute sechs Stufen kennt. */
export const STRENGTH_STEPS = 6

/**
 * Die oberen Budgetgrenzen der Stufen 1 bis 5, in aufsteigender Ordnung.
 *
 * Eine Art zählt so viele Schwellen, die sie erreicht, und ist damit so stark
 * wie ihre Stufe. Der Wert steht hier und nicht beim Aufrufer, weil er eine
 * `[K]`-Zahl ist und nicht an vier Stellen gepflegt werden darf.
 */
const BUDGET_THRESHOLDS = [12000, 14000, 15000, 16500, 18500] as const

/** Das Elementbudget einer Art: die Summe ihrer drei vererbbaren Elemente. */
export function elementBudget(
  elements: readonly [number, number, number],
): number {
  return elements[0] + elements[1] + elements[2]
}

/**
 * Die Stärke einer Art, abgeleitet aus ihrem Elementbudget.
 *
 * Sie nimmt die Elemente und nicht die Basis-Art, damit derselbe Aufruf auch
 * für ein gezüchtetes Genom gilt, dessen Elemente von der Basisart gewichen
 * sind. Für die Basisart ist beides identisch.
 */
export function strengthOfElements(
  elements: readonly [number, number, number],
): number {
  const budget = elementBudget(elements)
  let strength = 0
  for (const threshold of BUDGET_THRESHOLDS) {
    if (budget >= threshold) strength += 1
  }
  return strength
}

/** Die Stärke einer Basis-Art. Kurzform für den Registry-Zugriff. */
export function strengthOfBase(base: BaseMonster): number {
  return strengthOfElements(base.elements)
}

/**
 * Die beiden Größen, die die Goldformel für ein gefallenes Wesen braucht.
 *
 * Sie stehen hier, weil der Genom-Besitzer die Daten hat und niemand sonst: die
 * Stärke aus den Elementen, die Generation aus dem Genom. Die Formel selbst
 * rechnet `packages/client/src/village/loot.ts` — getrennt, weil sie eine
 * Dorfwirtschaftsfrage ist und kein Zuchtergebnis. Diese Funktion ist nur die
 * Brücke und kennt keine Goldformel.
 */
export function lootProfile(genome: Genome): {
  strength: number
  generation: number
} {
  return {
    strength: strengthOfElements(genome.elements),
    generation: genome.generation,
  }
}
