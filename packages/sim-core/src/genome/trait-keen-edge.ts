import { modifier } from './effect-kit'

/**
 * `keenEdge` — schärferer Angriff, weniger Halt.
 *
 * Das Wesen trifft härter, hält aber einen Treffer schlechter aus. Wie
 * `toughHide` gibt und nimmt, damit der Gegensatz nicht in eine freie
 * Verbesserung kippt.
 */
export const keenEdge = modifier('keenEdge', (stats) => ({
  ...stats,
  attack: Math.trunc((stats.attack * 135) / 100),
  maxHp: Math.trunc((stats.maxHp * 88) / 100),
}))
