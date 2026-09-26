/**
 * Der HTTP-Rand gegen echtes SQL, nicht gegen einen Mock.
 *
 * Der Sync-Checkpoint ist der einzige Weg, auf dem das Spiel Daten nach aussen
 * gibt. Ein Mock würde genau das testen, was schon vorher stimmte: dass
 * `fetch` eine Funktion zurückgibt. Der SQLite-D1-Doppel führt Migration,
 * Trigger und Batch real aus, sonst wäre ein 201 hier wertlos.
 */
import { describe, expect, it } from 'vitest'
import { upload } from '../test/raid-fixtures'
import { SqliteD1 } from '../test/sqlite-d1.mjs'
import type { D1Database } from './db'
import worker from './worker'

const ORIGIN = 'https://feed-the-floor-bleed.vannon-fs.workers.dev'

function call(path: string, init?: RequestInit, db?: D1Database) {
  return worker.fetch(new Request(`${ORIGIN}${path}`, init), { RAID_DB: db })
}

function checkpoint(key: string) {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      idempotencyKey: key,
      attackerId: 'player-1',
      upload: upload(),
    }),
  }
}

describe('Der Worker-Rand', () => {
  it('meldet beim Aufruf, ob Sync angebunden ist', async () => {
    const ohne = await call('/api/health')
    expect(ohne.status).toBe(200)
    expect(await ohne.json()).toMatchObject({ ok: true, spiel: 'lokal' })
    const mit = await call('/api/health', undefined, new SqliteD1())
    expect(await mit.json()).toMatchObject({ syncAktiv: true })
  })

  it('laesst das Spiel laufen, auch wenn keine D1-Bindung da ist', async () => {
    const antwort = await call('/api/sync/checkpoint', checkpoint('job-1'))
    expect(antwort.status).toBe(503)
    expect(await antwort.json()).toMatchObject({
      fehler: 'SYNC_NICHT_VERBUNDEN',
    })
  })

  it('schreibt einen Sync-Checkpoint, erkennt die Wiederholung und verweigert den zweiten offenen Job', async () => {
    const db = new SqliteD1()
    const erst = await call('/api/sync/checkpoint', checkpoint('job-1'), db)
    expect(erst.status).toBe(201)
    expect(db.hasSnapshot('job-1')).toBe(true)
    const wieder = await call('/api/sync/checkpoint', checkpoint('job-1'), db)
    expect(wieder.status).toBe(200)
    expect(await wieder.json()).toMatchObject({ idempotent: true })
    expect(db.batchCalls).toBe(2)
    // Ein zweiter offener Job pro Angreifer: der Store lehnt ab, und weil der
    // Batch zurueckgerollt wurde, liegt auch kein halber Checkpoint vor.
    const zweiter = await call('/api/sync/checkpoint', checkpoint('job-2'), db)
    expect(zweiter.status).toBe(409)
    expect(await zweiter.json()).toMatchObject({ fehler: 'OPEN_JOB_CONFLICT' })
    expect(db.hasSnapshot('job-2')).toBe(false)
  })

  it('liest den Checkpoint zurueck und meldet fehlende Jobs als 404', async () => {
    const db = new SqliteD1()
    await call('/api/sync/checkpoint', checkpoint('job-1'), db)
    const da = await call('/api/sync/job/job-1', undefined, db)
    expect(await da.json()).toMatchObject({ job: { id: 'job-1' } })
    const weg = await call('/api/sync/job/gibt-es-nicht', undefined, db)
    expect(weg.status).toBe(404)
  })

  it('trennt fehlerhafte Eingaben, Methoden und Routen sauber', async () => {
    const db = new SqliteD1()
    const kaputt = await call(
      '/api/sync/checkpoint',
      { method: 'POST', body: '{' },
      db,
    )
    expect(kaputt.status).toBe(400)
    const falscheMethode = await call('/api/sync/checkpoint', undefined, db)
    expect(falscheMethode.status).toBe(405)
    const unbekannt = await call('/api/gibtsnicht', undefined, db)
    expect(unbekannt.status).toBe(404)
  })
})
