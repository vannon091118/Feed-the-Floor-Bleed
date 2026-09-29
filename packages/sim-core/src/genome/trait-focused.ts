import { modifier, shiftCooldown } from './effect-kit'

/**
 * `focused` — ein Zug pro Angriff statt zwei.
 *
 * Das Wesen verliert den Schnellangriff und gewinnt Genauigkeit: der Angriff
 * steigt, die eigene Deckung sinkt. Es ist die ruhige Hälfte zu `restless`.
 */
export const focused = modifier('focused', (stats) => ({
  ...stats,
  attack: Math.trunc((stats.attack * 110) / 100),
  attackCooldown: shiftCooldown(stats.attackCooldown, -1),
  defense: Math.trunc((stats.defense * 92) / 100),
}))
