/**
 * Strikte Wire-Form des Combat-Logs.
 *
 * Die Engine kennt bewusst keine Protokollversion: `sim-core` liefert einen
 * versionfreien Log, der Aufrufer hüllt ihn in `RaidLogPayload` mit Envelope.
 * Jedes Schema ist `.strict()`, damit unbekannte Felder keinen
 * ahead-of-time-Vertrag stillschweigend erweitern.
 *
 * Die festen Wörter — Stufen, Ereignisarten, Seiten, Rollen und Profile —
 * stehen in `combat-vocabulary.ts`, weil sie mehrere Formen tragen; hier steht
 * ausschließlich ihre Verwendung.
 */
import { z } from 'zod'
import { HeroClassSchema } from './abilities'
import {
  CombatEventTypeSchema,
  CombatRoleSchema,
  CombatSideSchema,
  CombatStageSchema,
  MonsterBehaviorSchema,
} from './combat-vocabulary'
import { CombatTrailEntrySchema } from './trail'

/** Achtstelliger Hex-Hash wie `fingerprintCombatLog` ihn liefert. */
export const CombatHashSchema = z.string().regex(/^[0-9a-f]{8}$/)
// Die Zahlformen des Wire-Formats. `combat-summary.ts` nutzt dieselben: eine
// zweite Definition wäre eine zweite Wahrheit über dasselbe Feld.
export const fixed = z.number().int()
export const count = z.number().int().nonnegative()
const unitId = z.string().min(1)
export const CombatConfigSchema = z
  .object({
    tickRate: z.number().int().positive(),
    maxTicks: z.number().int().positive(),
    attackRange: count,
    damageFloor: fixed.nonnegative(),
    variancePermille: fixed,
    varianceSwing: fixed.nonnegative(),
  })
  .strict()

export const CombatUnitSpecSchema = z
  .object({
    id: unitId,
    side: CombatSideSchema,
    role: CombatRoleSchema,
    /** Verhalten aus dem Genom der Art; `none` ist der Grundfall. */
    behavior: MonsterBehaviorSchema,
    /** Klasse des Helden; `none` steht bei Monstern und klassenlosen Helden. */
    class: HeroClassSchema,
    maxHp: fixed.positive(),
    attack: fixed.nonnegative(),
    defense: fixed.nonnegative(),
    initiative: z.number().int().min(0).max(1000),
    moveCooldown: z.number().int().positive(),
    attackCooldown: z.number().int().positive(),
    routeIndex: count,
    /** Zone der Platzierungsgruppe, in der der Verteidiger aufgestellt ist; `-1` sonst. */
    ambushZoneId: z.number().int().min(-1),
  })
  .strict()

export const CombatEventSchema = z
  .object({
    tick: count,
    type: CombatEventTypeSchema,
    actorId: z.string(),
    targetId: z.string(),
    amount: fixed.nonnegative(),
    fromIndex: count,
    toIndex: count,
    stage: z.union([CombatStageSchema, z.literal('running')]),
  })
  .strict()

export const CombatLogSchema = z
  .object({
    seed: z.number().int().nonnegative(),
    config: CombatConfigSchema,
    units: z.array(CombatUnitSpecSchema).min(1).max(11),
    events: z.array(CombatEventSchema).min(1),
    stage: CombatStageSchema,
    ticks: count,
    hash: CombatHashSchema,
    trail: z.array(CombatTrailEntrySchema).min(1).max(4096),
  })
  .strict()
  .superRefine((log, context) => {
    const known = new Set(log.units.map((unit) => unit.id))
    if (known.size !== log.units.length)
      context.addIssue({
        code: 'custom',
        message: 'Einheiten-IDs müssen eindeutig sein',
      })
    const last = log.events[log.events.length - 1]
    if (last?.type !== 'end' || last.stage !== log.stage)
      context.addIssue({
        code: 'custom',
        message: 'Log schließt mit einem end-Ereignis in der Ergebnisstufe',
      })
    // Ohne diese Invariante fände ein Replay eine Einheit neben dem Trail: der
    // Zustandsaufbau liest ihre Zone über `trail[routeIndex]`.
    if (log.units.some((unit) => unit.routeIndex >= log.trail.length))
      context.addIssue({
        code: 'custom',
        message: 'Jede Einheit steht auf einer Trail-Zelle',
      })
    const stray = log.events.some(
      (event) =>
        (event.actorId !== '' && !known.has(event.actorId)) ||
        (event.targetId !== '' && !known.has(event.targetId)),
    )
    if (stray)
      context.addIssue({
        code: 'custom',
        message: 'Ereignisse verweisen nur auf bekannte Einheiten',
      })
    if (log.events.some((event) => event.tick > log.ticks))
      context.addIssue({
        code: 'custom',
        message: 'Kein Ereignis liegt hinter dem Log-Ende',
      })
  })

export type CombatConfig = z.infer<typeof CombatConfigSchema>
export type CombatUnitSpec = z.infer<typeof CombatUnitSpecSchema>
export type CombatEvent = z.infer<typeof CombatEventSchema>
export type CombatLog = z.infer<typeof CombatLogSchema>
