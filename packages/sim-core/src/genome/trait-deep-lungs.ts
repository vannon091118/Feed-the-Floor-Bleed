import { initiative, modifier, shiftCooldown } from './effect-kit'

/**
 * `deepLungs` — Ausdauer über die Zeit, auf Kosten des Tempos.
 *
 * Das Wesen ist zäh und kommt spät dran: die Initiative sinkt und der Angriff
 * verzögert sich, während die Gesundheit leicht steigt. Der Vorteil liegt im
 * Kampfverlauf, nicht in einem besseren ersten Schlag.
 */
export const deepLungs = modifier('deepLungs', (stats) => ({
  ...stats,
  maxHp: Math.trunc((stats.maxHp * 105) / 100),
  initiative: initiative(stats.initiative - 80),
  attackCooldown: shiftCooldown(stats.attackCooldown, 1),
}))
