import { bonusEffect, traitEffect } from './effects'
import { monsterStats } from './stats'
import type { Genome, MonsterStats } from './types'

/**
 * Die Reihenfolge ist die Regel und steht hier, damit sie nicht verteilt
 * mitgedacht werden muss:
 *
 * 1. Die Kopplung rechnet die Elemente auf Basiswerte (`stats.ts`).
 * 2. Die Traits schreiben darauf — sie sind das Wesen.
 * 3. Die Boni schreiben zuletzt — sie sind die Ausstattung.
 *
 * Traits vor Boni zu halten ist der Grund, warum ein `bulwark` auf einem
 * `toughHide`-Monster mehr trägt als auf einem nackten: der Bonus verstärkt,
 * was der Trait bereits aufgebaut hat.
 */
export function resolveStats(genome: Genome): MonsterStats {
  let stats = monsterStats(genome.elements)
  for (const trait of genome.traits) {
    stats = traitEffect(trait).apply(stats, genome)
  }
  for (const bonus of genome.bonuses) {
    stats = bonusEffect(bonus).apply(stats, genome)
  }
  return stats
}
