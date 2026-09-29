import { bumpDefense, modifier } from './effect-kit'

/**
 * `bulwark` — reine Deckung.
 *
 * Der Bonus kennt nur die Verteidigung. Er ist bewusst der schmaleseste der
 * sechs, damit ein Stapel aus schmalen Bonusun ein breiteres Monster ergibt
 * als ein einzelner breiter.
 */
export const bulwark = modifier('bulwark', (stats) => ({
  ...stats,
  defense: bumpDefense(stats, 80),
}))
