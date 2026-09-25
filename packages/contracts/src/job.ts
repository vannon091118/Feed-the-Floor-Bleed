import { z } from 'zod'
import {
  ErrorCodeSchema,
  ErrorPayloadSchema,
  ResultPayloadSchema,
} from './protocol'
import { versionEnvelope } from './version'

/**
 * Auftragszustände. Diese Liste ist die *einzige* Quelle der Truth: Server,
 * D1-Check-Constraint, Client und lokale Fixture-Ausführung benutzen dieselben
 * Strings. `expired` ist vom normalen Fehler getrennt, weil eine abgelaufene
 * Auftragsfrist immer den Code `timeout` trägt.
 */
export const RAID_JOB_STATUSES = [
  'accepted',
  'queued',
  'running',
  'completed',
  'failed',
  'expired',
] as const

export const RaidJobStatusSchema = z.enum(RAID_JOB_STATUSES)

export type RaidJobStatus = z.infer<typeof RaidJobStatusSchema>

export const RAID_JOB_TRANSITIONS: Record<
  RaidJobStatus,
  readonly RaidJobStatus[]
> = {
  accepted: ['queued', 'failed', 'expired'],
  queued: ['running', 'failed', 'expired'],
  running: ['completed', 'failed', 'expired'],
  completed: [],
  failed: [],
  expired: [],
}

export function canTransitionRaidJob(
  from: RaidJobStatus,
  to: RaidJobStatus,
): boolean {
  return RAID_JOB_TRANSITIONS[from].includes(to)
}

export function isTerminalRaidJob(status: RaidJobStatus): boolean {
  return RAID_JOB_TRANSITIONS[status].length === 0
}

const jobBase = versionEnvelope.extend({
  id: z.string().min(1),
  floor: z.number().int().positive(),
  seed: z.number().int().nonnegative(),
  revision: z.number().int().nonnegative(),
  expiresAt: z.number().int().nonnegative(),
})

function openJob(status: 'accepted' | 'queued' | 'running') {
  return jobBase.extend({ status: z.literal(status) }).strict()
}

const completedJob = jobBase
  .extend({ status: z.literal('completed'), result: ResultPayloadSchema })
  .strict()

const failedJob = jobBase
  .extend({
    status: z.literal('failed'),
    error: ErrorPayloadSchema.extend({
      code: ErrorCodeSchema.exclude(['timeout']),
    }).strict(),
  })
  .strict()

const expiredJob = jobBase
  .extend({
    status: z.literal('expired'),
    error: ErrorPayloadSchema.extend({ code: z.literal('timeout') }).strict(),
  })
  .strict()

/**
 * `status` ist der Discriminator: `completed` *muss* ein Ergebnis tragen,
 * `failed`/`expired` *müssen* einen Fehler tragen, offene Zustände dürfen
 * weder Ergebnis noch Fehler haben. Diese Mischzustände sind damit nicht
 * darstellbar — weder im Typ noch in der Datenbank.
 */
export const RaidJobSchema = z.discriminatedUnion('status', [
  openJob('accepted'),
  openJob('queued'),
  openJob('running'),
  completedJob,
  failedJob,
  expiredJob,
])

export type RaidJob = z.infer<typeof RaidJobSchema>
export type CompletedRaidJob = Extract<RaidJob, { status: 'completed' }>
/** Aufträge mit Ergebnis, Fehler oder Timeout — nie ein offener Zustand. */
export type TerminalRaidJob = Extract<
  RaidJob,
  { status: 'completed' | 'failed' | 'expired' }
>
