import { initiative, modifier, shiftCooldown } from './effect-kit'

/**
 * `restless` — das Wesen ist ungeduldig und immer zuerst dran.
 *
 * Die Initiative steigt deutlich, der eigene Körper trägt den Schritt nicht
 * ganz mit: weniger Gesundheit, mehr Tempo. Wer schnell ist, trifft öfter und
 * bleibt kürzer stehen.
 */
export const restless = modifier('restless', (stats) => ({
  ...stats,
  initiative: initiative(stats.initiative + 150),
  moveCooldown: shiftCooldown(stats.moveCooldown, -1),
  maxHp: Math.trunc((stats.maxHp * 92) / 100),
}))
