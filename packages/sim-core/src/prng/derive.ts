export function mix32(value: number): number {
  let mixed = value >>> 0
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x7feb352d) >>> 0
  mixed = Math.imul(mixed ^ (mixed >>> 15), 0x846ca68b) >>> 0
  return (mixed ^ (mixed >>> 16)) >>> 0
}

export function deriveSeed(seed: number, index: number, salt = 0): number {
  const combined =
    mix32(seed) ^ Math.imul(index >>> 0, 0x9e3779b1) ^ mix32(salt)
  return mix32(combined)
}
