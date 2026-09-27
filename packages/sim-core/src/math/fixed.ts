export const FIXED_SCALE = 1000

export function toFixed(whole: number, milli = 0): number {
  return whole * FIXED_SCALE + milli
}

/**
 * Multipliziert zwei Fixed-Point-Werte.
 *
 * Exakt, solange das Ergebnis unter der Mantissengrenze 2^53 bleibt: die
 * IEEE-Multiplikation rundet das Produkt relativ, der Rundungsfehler wird
 * durch `FIXED_SCALE` geteilt und unterschreitet damit die ganzzahlige
 * Auflösung. Die Combat-Werte liegen bei 1,6e4 mal 1e3 (angreifender Wert mal
 * Streuung), also um Größenordnungen darunter. Oberhalb der Grenze weicht das
 * Ergebnis um wenige Einheiten ab — deterministisch, aber falsch; deshalb
 * steht die Grenze hier und ist in `math.test.ts` gepinnt.
 */
export function mulFixed(left: number, right: number): number {
  return Math.trunc((left * right) / FIXED_SCALE)
}

/**
 * Dividiert zwei Fixed-Point-Werte.
 *
 * Exakt, solange der Zähler `left * FIXED_SCALE` unter der Mantissengrenze 2^53
 * bleibt, also bis `|left| = 2^53 / FIXED_SCALE`, rund 9,0e12: der Zähler ist
 * dann exakt, der Quotient bleibt ganzzahlig darstellbar, und der wahre Wert
 * liegt mindestens `1 / right` von der Trunkierungsgrenze entfernt — weiter,
 * als die korrekt gerundete Division ihn verschieben kann. Oberhalb rundet
 * schon der Zähler um bis zu eine halbe ulp, und das Ergebnis weicht ab:
 * gemessen um 1 bei `divFixed(9_007_199_254_740_994, 1001)` und um 170 bei
 * `divFixed(2 ** 53, 3)` — deterministisch, aber falsch. Deshalb steht die
 * Grenze hier und ist in `math.test.ts` gepinnt. Division durch null wirft.
 */
export function divFixed(left: number, right: number): number {
  if (right === 0) throw new Error('fixed division by zero')
  return Math.trunc((left * FIXED_SCALE) / right)
}

export function clampInt(value: number, min: number, max: number): number {
  if (value < min) return min
  if (value > max) return max
  return value
}

export function absInt(value: number): number {
  return value < 0 ? -value : value
}
