import { modifier, shiftCooldown } from './effect-kit'

/**
 * `toughHide` — die Haut hält mehr aus, das Wesen bewegt sich aber schwerer.
 *
 * Der trade-off ist Absicht: der Effekt darf nicht nur geben. Einhäutige
 * Wesen sollen darunter leiden, ihren Vorteil in der Zähigkeit zu behalten.
 */
export const toughHide = modifier('toughHide', (stats) => ({
  ...stats,
  maxHp: Math.trunc((stats.maxHp * 115) / 100),
  defense: Math.trunc((stats.defense * 130) / 100),
  moveCooldown: shiftCooldown(stats.moveCooldown, 1),
}))
