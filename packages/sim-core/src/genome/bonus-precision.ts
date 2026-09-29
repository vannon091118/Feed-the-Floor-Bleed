import { modifier, shiftCooldown } from './effect-kit'

/**
 * `precision` — der Angriffszielpunkt stimmt.
 *
 * Wie `swiftness` greift es häufiger an, aber über einen anderen Hebel: die
 * Initiative bleibt, der Cooldown sinkt. Zwei Boni mit ähnlichem Bild, dem
 * Takt nach verschieden — das ist Absicht, sonst wären sechs Boni drei.
 */
export const precision = modifier('precision', (stats) => ({
  ...stats,
  attackCooldown: shiftCooldown(stats.attackCooldown, -1),
  attack: Math.trunc((stats.attack * 108) / 100),
}))
