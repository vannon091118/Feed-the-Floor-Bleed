import { z } from 'zod'

/**
 * Die Rollen und Fähigkeiten der Helden — das Wire-Vokabular von Phase 3.
 *
 * Die Datei liegt im Contract und nicht im Core, weil beide Seiten dieselben
 * Wörter brauchen: `sim-core` rechnet mit ihnen, der Angreifer darf sie sehen,
 * und der Server prüft sie. Zwei Listen wären zwei Wahrheiten; die Drift fiele
 * erst beim Upload auf. Der Core liest von hier, nie umgekehrt.
 *
 * **Die Werte dahinter sind `[K]` und noch nicht abgenommen.** Diese Datei
 * führt ausschließlich die Namen; jede Zahl — Klassenboni, Fähigkeitswirkungen,
 * Schwellen — steht an ihrer Quelle im Core und trägt dort ihren Vermerk.
 *
 * `none` ist in beiden Listen der Grundfall und kein Platzhalter: Helden ohne
 * Klasse und Monster tragen ihn, und die Simulation behandelt ihn wie vor
 * Phase 3. Damit bleibt jeder eingefrorene Stand lesbar.
 */
export const HERO_CLASSES = [
  'none',
  'vanguard',
  'breaker',
  'scout',
  'medic',
  'controller',
  'guardian',
] as const
export const HeroClassSchema = z.enum(HERO_CLASSES)
export type HeroClass = z.infer<typeof HeroClassSchema>

/** Die sechs Fähigkeiten, je eine pro Klasse; `reveal` ist die des Spähers. */
export const ABILITY_IDS = [
  'shield',
  'shatter',
  'reveal',
  'mend',
  'frost',
  'hold',
] as const
export const AbilityIdSchema = z.enum(ABILITY_IDS)
export type AbilityId = z.infer<typeof AbilityIdSchema>

/**
 * Wann eine Taktikregel greift.
 *
 * `immediate` ist die Regel ohne Bedingung: die Fähigkeit fällt beim ersten
 * eigenen Zug, sobald sie frei ist. Die drei anderen Bedingungen brauchen eine
 * Schwelle in Promille — `thresholdPermille` ist Pflicht, sobald die Bedingung
 * sie liest, und verboten, wo sie nichts bedeutete; ein unbenutzter Wert wäre
 * eine Zahl ohne Leser. Dieselbe Grenze wie bei den Profilen: eine Regel
 * entscheidet **wann**, nie **wie viel**.
 */
export const TACTIC_WHEN_KINDS = [
  'immediate',
  'allyBelow',
  'selfBelow',
  'bossNear',
] as const
export const TacticWhenSchema = z
  .object({
    kind: z.enum(TACTIC_WHEN_KINDS),
    thresholdPermille: z.number().int().min(0).max(1000).optional(),
  })
  .strict()
  .superRefine((when, context) => {
    const needsThreshold =
      when.kind === 'allyBelow' || when.kind === 'selfBelow'
    if (needsThreshold && when.thresholdPermille === undefined)
      context.addIssue({
        code: 'custom',
        message: `${when.kind} braucht thresholdPermille`,
      })
    if (!needsThreshold && when.thresholdPermille !== undefined)
      context.addIssue({
        code: 'custom',
        message: `${when.kind} liest keine Schwelle`,
      })
  })

/**
 * Eine Taktikregel: welche Fähigkeit, unter welcher Bedingung.
 *
 * `when` ist optional und bedeutet fehlend `immediate` — der Angreifer stellt
 * drei Regeln je Held auf, und die erste offene Regel, deren Bedingung erfüllt
 * ist, verbraucht ihre Fähigkeit. Ausgeführt wird die Liste im Core (`tactics`),
 * deterministisch und ohne Zufall; hier steht nur ihre Form.
 */
export const TacticRuleSchema = z
  .object({
    ability: AbilityIdSchema,
    when: TacticWhenSchema.optional(),
  })
  .strict()
export type TacticWhen = z.infer<typeof TacticWhenSchema>
export type TacticRule = z.infer<typeof TacticRuleSchema>
