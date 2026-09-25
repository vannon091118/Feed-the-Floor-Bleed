import { FIXED_SCALE } from './fixed'

export function isqrt(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  let remainder = Math.trunc(value)
  let result = 0
  let bit = 1 << 30
  while (bit > remainder) bit >>>= 2
  while (bit !== 0) {
    const candidate = result + bit
    if (remainder >= candidate) {
      remainder -= candidate
      result = (result >>> 1) + bit
    } else {
      result >>>= 1
    }
    bit >>>= 2
  }
  return result
}

export function sqrtFixed(value: number): number {
  if (value <= 0) return 0
  return isqrt(value * FIXED_SCALE)
}
