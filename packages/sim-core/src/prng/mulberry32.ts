export interface RngState {
  state: number
}

export function createRng(seed: number): RngState {
  return { state: seed >>> 0 }
}

export function nextUint32(rng: RngState): number {
  rng.state = (rng.state + 0x6d2b79f5) >>> 0
  let value = rng.state
  value = Math.imul(value ^ (value >>> 15), value | 1) >>> 0
  value = (value ^ (value + Math.imul(value ^ (value >>> 7), value | 61))) >>> 0
  rng.state = value
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
