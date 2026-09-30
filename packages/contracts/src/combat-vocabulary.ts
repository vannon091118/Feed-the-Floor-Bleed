import { z } from 'zod'

/**
 * Das feste Vokabular des Kampf-Logs — eine Datei für die Wörter, eine für die
 * Form.
 *
 * Die Listen stehen hier und nicht in `combat-log.ts`, weil sie den
 * gemeinsamen Wortschatz mehrerer Formen tragen: `combat-summary.ts` liest
 * `CombatStageSchema`, `protocol.ts` den Rest, und `sim-core` liest
 * `MONSTER_BEHAVIORS` von hier, statt die vier Namen daneben zu führen. Eine
 * zweite Liste wäre eine zweite Wahrheit, und die Drift fiele erst an einem
 * `.strict()`-Schema auf.
 *
 * Ausgelagert ist das Vokabular, nicht die Form: `combat-log.ts` wäre mit den
 * neuen Werten über den 120-Zeilen-Cap der Domäne gelaufen — derselbe Grund,
 * aus dem `combat-summary.ts` und `trail.ts` schon ausgezogen sind.
 */
export const COMBAT_STAGES = [
  'heroes-win',
  'monsters-win',
  'timeout',
  /**
   * Kein Kampfergebnis: der Lauf wurde nach dem Boss-Sieg gesichert.
   *
   * Die Engine liefert diese Stufe nicht, der Auftrag setzt sie. Sie steht im
   * Vokabular, weil ein gesicherter Lauf ein Ergebnis mit eigenem Namen ist und
   * nicht als `timeout` gelten darf.
   */
  'extracted',
] as const
/**
 * Die Ereignisarten des Logs.
 *
 * `ability` trägt die Wirkung einer Klassenfähigkeit in `amount`, `reveal` die
 * aufgedeckte Zelle in `toIndex` — bei `move` trägt `toIndex` dagegen den
 * Trail-Schritt. Beide Ereignisse stehen im Log, weil ein Replay nur den Log
 * liest: eine Fähigkeit ohne Ereignis existierte im Replay nicht.
 */
export const COMBAT_EVENT_TYPES = [
  'move',
  'attack',
  'death',
  'ambush',
  'ability',
  'reveal',
  'end',
] as const
export const COMBAT_SIDES = ['heroes', 'monsters'] as const
export const COMBAT_ROLES = ['hero', 'monster', 'boss'] as const
/**
 * Verhaltensprofil des Verteidigers — abgeleitet aus dem Genom, nicht gesetzt.
 *
 * **Das Verhalten sagt, wie das Wesen im Kampf sein Ziel wählt.** Sein
 * Gegenstück ist der Archetyp an der Basis-Art (`genome/types.ts`): **was** das
 * Wesen ist. Das sind zwei Begriffe und entschieden zwei, nicht zwei Namen für
 * dieselbe Frage: `tank` steht in beiden Listen und beantwortet dort zwei
 * verschiedene Dinge.
 *
 * `none` ist der Grundfall (Helden, Boss, Arten ohne Profil): das nächste
 * Ziel. Die drei Profile ändern ausschließlich die Zielentscheidung und damit
 * keine Zahl — daran liegt es, warum sie im Log stehen und nicht nur im
 * Speicher: ein Replay liest nur den Log und müsste die Wahl sonst neu
 * erfinden.
 */
export const MONSTER_BEHAVIORS = ['none', 'tank', 'hunter', 'control'] as const

export const CombatStageSchema = z.enum(COMBAT_STAGES)
export const CombatEventTypeSchema = z.enum(COMBAT_EVENT_TYPES)
export const CombatSideSchema = z.enum(COMBAT_SIDES)
export const CombatRoleSchema = z.enum(COMBAT_ROLES)
export const MonsterBehaviorSchema = z.enum(MONSTER_BEHAVIORS)

export type CombatStage = z.infer<typeof CombatStageSchema>
export type MonsterBehavior = z.infer<typeof MonsterBehaviorSchema>
export type CombatEventType = z.infer<typeof CombatEventTypeSchema>
