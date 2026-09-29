import { modifier } from './effect-kit'

/**
 * `endurance` — mehr Leben im Kampf, für jedes Wesen gleich.
 *
 * Der Faktor ist fest und liegt zwischen dem leichtesten und dem schwersten
 * Zuschlag, den `vitality` vergeben kann. Genau darin unterscheiden sich die
 * beiden: hier wächst die Gesundheit aus dem Wesen heraus, `vitality` wächst
 * mit der Masse.
 */
export const endurance = modifier('endurance', (stats) => ({
  ...stats,
  maxHp: Math.trunc((stats.maxHp * 120) / 100),
}))
