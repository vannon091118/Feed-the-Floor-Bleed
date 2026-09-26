/**
 * Animation ist reine Präsentation und läuft auf der Render-Uhr.
 * Alle Werte hängen nur von `clockMs` und einem stabilen Seed ab.
 */

const TAU = Math.PI * 2

export function periodicWave(
  clockMs: number,
  periodMs: number,
  seed: number,
): number {
  const cycles = clockMs / periodMs + seed / TAU
  const phase = ((cycles % 1) + 1) % 1
  const halfPhase = phase < 0.5 ? phase * 2 : (phase - 0.5) * 2
  const eased =
    halfPhase * halfPhase * halfPhase * (halfPhase * (halfPhase * 6 - 15) + 10)
  return phase < 0.5 ? -1 + 2 * eased : 1 - 2 * eased
}

export function bob(clockMs: number, seed: number): number {
  return periodicWave(clockMs, TAU * 180, seed) * 1.5
}

export function squash(
  clockMs: number,
  seed: number,
): { x: number; y: number } {
  const wave = periodicWave(clockMs, TAU * 120, seed)
  return { x: 1 + wave * 0.05, y: 1 - wave * 0.05 }
}

export function walkSway(clockMs: number, seed: number): number {
  return periodicWave(clockMs, TAU * 90, seed) * 0.12
}

export function stepLift(clockMs: number, seed: number): number {
  return ((periodicWave(clockMs, Math.PI * 130, seed * 2) + 1) / 2) * 3
}

export function fadeAlpha(ageMs: number, lifeMs: number): number {
  if (lifeMs <= 0) return 0
  return Math.max(0, 1 - ageMs / lifeMs)
}

export function growScale(ageMs: number, lifeMs: number): number {
  if (lifeMs <= 0) return 0
  return Math.min(1, ageMs / (lifeMs * 0.25))
}
