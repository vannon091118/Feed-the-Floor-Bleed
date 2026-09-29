import { initiative, modifier, shiftCooldown } from './effect-kit'

/**
 * `swiftness` — öfter dran.
 *
 * Greift schneller an und bewegt sich schneller, kostet dafür Initiative. So
 * entsteht eine Wahl statt einer Dominanz: Initiative ist endlich, deshalb
 * lohnt sich `swiftness` nicht auf jedem Wesen.
 */
export const swiftness = modifier('swiftness', (stats) => ({
  ...stats,
  attackCooldown: shiftCooldown(stats.attackCooldown, -1),
  moveCooldown: shiftCooldown(stats.moveCooldown, -1),
  initiative: initiative(stats.initiative - 60),
}))
