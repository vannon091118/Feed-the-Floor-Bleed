/**
 * Der HTTP-Rand von `feed-the-floor-bleed.vannon-fs.workers.dev`.
 *
 * Das Spiel kommt als Asset aus `packages/client/dist` und läuft vollständig im
 * Browser. `run_worker_first: ["/api/*"]` in `wrangler.jsonc` lässt diesen Code
 * nur bei einem Aufruf und bei Sync-Checkpoints laufen — kein Timer, kein Cron,
 * kein Dauerbetrieb. Fehlt die D1-Bindung, antwortet der Sync-Pfad mit 503 und
 * das Spiel läuft weiter: Ein fehlender Sync darf keinen spielbaren Stand
 * blockieren.
 */

import { ZodError } from 'zod'
import {
  type CheckpointRaidInput,
  type D1Database,
  D1RaidStore,
  RaidStoreError,
  type RaidStoreErrorCode,
} from './db'

/** Die Bindings, die der Worker erwartet. */
export interface WorkerEnv {
  /** D1-Datenbank fuer die Sync-Checkpoints; optional, das Spiel haengt nicht dran. */
  RAID_DB?: D1Database
}

/** Store-Fehlercode auf HTTP. Der Store bleibt der einzige Wahrheitssprecher. */
const HTTP_STATUS: Record<RaidStoreErrorCode, number> = {
  ATOMIC_CHECKPOINT_FAILED: 500,
  IDEMPOTENCY_CONFLICT: 409,
  INVALID_INPUT: 400,
  INVALID_TRANSITION: 409,
  JOB_NOT_FOUND: 404,
  OPEN_JOB_CONFLICT: 409,
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const path = new URL(request.url).pathname
    const store = env.RAID_DB ? new D1RaidStore(env.RAID_DB) : null
    try {
      if (path === '/api/health')
        return json({ ok: true, spiel: 'lokal', syncAktiv: store !== null })
      if (!store)
        return json(
          {
            fehler: 'SYNC_NICHT_VERBUNDEN',
            meldung:
              'Keine D1-Bindung. Das Spiel laeuft lokal, es wird nichts gespeichert.',
          },
          503,
        )
      if (path === '/api/sync/checkpoint') {
        if (request.method !== 'POST')
          return json({ fehler: 'METHODE_ERLAUBT' }, 405)
        // `now` steht hinter dem Spread: der Client darf den Zeitstempel nicht
        // waehlen, `expires_at` und `revision` haengen daran. Alles andere
        // validiert der Store und meldet es als `INVALID_INPUT`.
        const eingabe = {
          ...((await request.json()) as CheckpointRaidInput),
          now: Date.now(),
        }
        const ergebnis = await store.checkpoint(eingabe)
        return json(
          { idempotent: ergebnis.idempotent, job: ergebnis.job },
          ergebnis.idempotent ? 200 : 201,
        )
      }
      if (path.startsWith('/api/sync/job/')) {
        const id = path.slice('/api/sync/job/'.length)
        const job = await store.getJob(id)
        if (!job) throw new RaidStoreError('JOB_NOT_FOUND', `Job ${id} fehlt`)
        return json({ job })
      }
      return json({ fehler: 'UNBEKANNTE_ROUTE', pfad: path }, 404)
    } catch (error) {
      if (error instanceof RaidStoreError)
        return json(
          { fehler: error.code, meldung: error.message },
          HTTP_STATUS[error.code],
        )
      if (error instanceof ZodError || error instanceof SyntaxError)
        return json({ fehler: 'UNGUELTIGE_ANFRAGE' }, 400)
      return json({ fehler: 'SERVERFEHLER' }, 500)
    }
  },
}
