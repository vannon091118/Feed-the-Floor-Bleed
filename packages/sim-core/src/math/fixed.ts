export const FIXED_SCALE = 1000

export function toFixed(whole: number, milli = 0): number {
  return whole * FIXED_SCALE + milli
}

export function mulFixed(left: number, right: number): number {
  return Math.trunc((left * right) / FIXED_SCALE)
}

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
