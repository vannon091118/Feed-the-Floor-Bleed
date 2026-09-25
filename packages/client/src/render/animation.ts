/**
 * Animation ist reine Präsentation und läuft auf der Render-Uhr.
 *
 * Alle Werte sind Funktionen von `clockMs` und einem stabilen Seed, nie von
 * verstecktem Zufall: derselbe Zeitpunkt liefert denselben Frame.
 */

export function bob(clockMs: number, seed: number): number {
  return Math.sin(clockMs / 180 + seed) * 1.5
}

export function squash(
  clockMs: number,
  seed: number,
): { x: number; y: number } {
  const wave = Math.sin(clockMs / 120 + seed)
  return { x: 1 + wave * 0.05, y: 1 - wave * 0.05 }
}

export function walkSway(clockMs: number, seed: number): number {
  return Math.sin(clockMs / 90 + seed) * 0.12
}

export function fadeAlpha(ageMs: number, lifeMs: number): number {
  if (lifeMs <= 0) return 0
  return Math.max(0, 1 - ageMs / lifeMs)
}

export function growScale(ageMs: number, lifeMs: number): number {
  if (lifeMs <= 0) return 0
  return Math.min(1, ageMs / (lifeMs * 0.25))
}
