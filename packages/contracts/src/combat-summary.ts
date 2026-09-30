import { z } from 'zod'
import { CombatHashSchema, count, fixed } from './combat-log'
import { CombatStageSchema } from './combat-vocabulary'

/**
 * Ergebnis-Kurzfassung für Listen, Logs und Client-Anzeige.
 *
 * Bewusst typisiert statt `record(json)`: ein freies JSON-Objekt wäre das
 * Gegenteil von „strikt serialisierbar“.
 *
 * Sie steht neben dem Log und nicht mehr darin, weil sie eine eigene Wire-Form
 * ist: der Log beschreibt den Lauf, die Kurzfassung sein Ergebnis. Beide
 * zusammen rissen den 120-Zeilen-Cap der Domäne; getrennt hat jede genau einen
 * Job, und dieselbe Auslagerung hat vorher schon `trail.ts` gehalten.
 *
 * `defendersTotal` ist der eingefrorene Verteidiger-Roster — alle Einheiten
 * der Monster-Seite, den Boss eingeschlossen. Ohne ihn ist die Zahl der im
 * Kampf gefallenen Gegner aus einem Ergebnis nicht ableitbar: `ResultPayload`
 * trägt den Kampflog nicht, und `monstersAlive` plus `bossAlive` nennen nur die
 * Überlebenden. Die Differenz `defendersTotal - monstersAlive - (bossAlive ? 1
 * : 0)` ist damit berechenbar, ohne den Log zu laden.
 *
 * Die Heldenseite hat bewusst kein Gegenstück: die Kampfwertung braucht nur die
 * Verteidiger, und ein Feld ohne Leser wäre vorbereitete Flexibilität.
 */
/**
 * Die verursachte Schadensmenge je Einheit, getrennt nach Seite.
 *
 * Die Gesamtzahl `damage` allein sagt nicht, **wer** sie verursacht hat. Für die
 * Erfahrung zählt aber genau das: Ein Wesen erfahrnt nach dem Schaden, den es
 * angerichtet hat, und das auch dann, wenn es dabei stirbt. Ohne diese Aufteilung
 * müsste der Client den Log selbst auswerten — und damit eine zweite Wahrheit
 * über denselben Lauf haben.
 *
 * Als **Liste** und nicht als Map: `z.record` erlaubt beliebige Schlüssel, und ein
 * unbekannter Schlüssel wäre eine Einheit, die der Log nicht kennt. Die Liste
 * bleibt sortierbar und wird beim Parsen gegen den Log geprüft.
 *
 * Getrennt nach `side`, weil Helden und Monster derselben Regel folgen, aber
 * getrennt gelesen werden: Die Heldenseite steht in der Beschaedigung des Teams,
 * die Monster-Seite in der Beute.
 */
const damageEntrySchema = z
  .object({
    unitId: z.string(),
    damage: fixed.nonnegative(),
  })
  .strict()

export const CombatSummarySchema = z
  .object({
    stage: CombatStageSchema,
    ticks: count,
    hash: CombatHashSchema,
    events: z.number().int().positive(),
    attacks: count,
    damage: fixed.nonnegative(),
    defendersTotal: count,
    heroesAlive: count,
    monstersAlive: count,
    bossAlive: z.boolean(),
    damageByHero: z.array(damageEntrySchema),
    damageByMonster: z.array(damageEntrySchema),
  })
  .strict()

export type CombatSummary = z.infer<typeof CombatSummarySchema>
