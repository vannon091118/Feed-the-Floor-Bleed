import { bumpAttack, modifier } from './effect-kit'

/**
 * `frenzy` — roher Angriff, sonst nichts.
 *
 * Wie `bulwark` der reine Angriffsbonus, bewusst ohne Nebeneffekt: der Reiz
 * entsteht aus der Kombination mit einem Trait, der die Kosten trägt.
 */
export const frenzy = modifier('frenzy', (stats) => ({
  ...stats,
  attack: bumpAttack(stats, 70),
}))
