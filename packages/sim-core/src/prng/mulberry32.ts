export interface RngState {
  state: number
}

export function createRng(seed: number): RngState {
  return { state: seed >>> 0 }
}

/**
 * Ein Zug aus dem Strom.
 *
 * **Der Zustand ist ein Additionszähler, nicht die Mischung.** `rng.state`
 * wandert nur um `0x6d2b79f5` weiter; der gemischte Wert geht **nicht** zurück
 * in den Zustand. Damit bleibt `state` nach n Zügen exakt
 * `(seed + n · 0x6d2b79f5) >>> 0` — die Eigenschaft, mit der sich ein Lauf an
 * einem Tick fortsetzen, prüfen und erklären lässt, ohne ihn zu wiederholen.
 *
 * Ein zurückgeschriebenes `rng.state = value` hätte beides zerstört und wäre
 * trotzdem durch alle Gates gegangen: der Kampf legt pro Wurf einen neuen
 * Strom aus einem abgeleiteten Seed an und zieht genau einmal, und die erste
 * Ziehung ist mit und ohne Rückkopplung bitgleich. Die Abweichung war damit
 * bis hier unerreichbar. `prng.test.ts` pinnt jetzt den Zähler und den
 * publizierten Vektor, damit die stille Abweichung nicht zurückkommt.
 */
export function nextUint32(rng: RngState): number {
  rng.state = (rng.state + 0x6d2b79f5) >>> 0
  let value = rng.state
  value = Math.imul(value ^ (value >>> 15), value | 1) >>> 0
  value = (value ^ (value + Math.imul(value ^ (value >>> 7), value | 61))) >>> 0
  return (value ^ (value >>> 14)) >>> 0
}

export function nextBelow(rng: RngState, bound: number): number {
  if (bound <= 0) throw new Error('bound must be positive')
  const limit = 0x100000000 - (0x100000000 % bound)
  let value = nextUint32(rng)
  while (value >= limit) value = nextUint32(rng)
  return value % bound
}

export function nextRange(
  rng: RngState,
  minInclusive: number,
  maxInclusive: number,
): number {
  if (maxInclusive < minInclusive)
    throw new Error('maxInclusive must not be below minInclusive')
  return minInclusive + nextBelow(rng, maxInclusive - minInclusive + 1)
}
