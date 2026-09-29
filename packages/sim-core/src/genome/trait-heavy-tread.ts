import { modifier, shiftCooldown } from './effect-kit'

/**
 * `heavyTread` — das Wesen ist schwer und bleibt stehen.
 *
 * Die Bewegung kostet mehr, die Gesundheit steigt dafür spürbar. Der Effekt
 * belohnt das Halten einer Stellung, nicht das Zuschlagen.
 */
export const heavyTread = modifier('heavyTread', (stats) => ({
  ...stats,
  maxHp: Math.trunc((stats.maxHp * 125) / 100),
  moveCooldown: shiftCooldown(stats.moveCooldown, 1),
  attack: Math.trunc((stats.attack * 90) / 100),
}))
