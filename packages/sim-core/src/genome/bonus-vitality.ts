import { modifier } from './effect-kit'
import { ELEMENT_MIN, type Genome } from './types'

/** Obergrenze des Zuschlags, in Promille. */
const MAX_BONUS = 260
/** Untergrenze des Zuschlags, in Promille. */
const MIN_BONUS = 120

/**
 * Wie viel Prozent ein Wesen zusätzlich bekommt, gelesen aus seiner Masse.
 *
 * Das Element 0 läuft von 1,00 bis 10,00; darüber wird der Zuschlag linear von
 * `MIN_BONUS` auf `MAX_BONUS` gestreckt. Ein leichtes Wesen bekommt also
 * deutlich weniger als ein schweres, und der Bonus liest damit das Genom
 * statt einer eigenen Zahl zu folgen.
 */
function massBonus(genome: Genome): number {
  const span = 10000 - ELEMENT_MIN
  const share = Math.trunc(((genome.elements[0] - ELEMENT_MIN) * 1000) / span)
  return MIN_BONUS + Math.trunc(((MAX_BONUS - MIN_BONUS) * share) / 1000)
}

/**
 * `vitality` — die Gesundheit folgt der Masse.
 *
 * Der Unterschied zu `endurance` ist genau dieser Anker: `endurance` addiert
 * einen festen Faktor auf jedes Wesen, `vitality` richtet sich nach dem
 * Element 0. Ein Glutkolos bekommt damit spürbar mehr als ein Schattenläufer,
 * obwohl beide denselben Bonus tragen.
 */
export const vitality = modifier('vitality', (stats, genome) => {
  const bonus = massBonus(genome)
  return {
    ...stats,
    maxHp: Math.trunc((stats.maxHp * (1000 + bonus)) / 1000),
    defense: Math.trunc((stats.defense * 104) / 100),
  }
})
