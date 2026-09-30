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

export function clampInt(value: number, min: number, max: number): number {
  if (value < min) return min
  if (value > max) return max
  return value
}

export function absInt(value: number): number {
  return value < 0 ? -value : value
}
