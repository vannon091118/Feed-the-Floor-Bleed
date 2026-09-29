import { sim_version } from '@floor/contracts'
import { describe, expect, it } from 'vitest'
import {
  databaseWith,
  jobById,
  migration,
  openJob,
  snapshot,
} from './migration-fixtures.mjs'

const toV5 = migration('003_contract_v5.sql')
const toV6 = migration('004_contract_v6.sql')

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} id
 * @returns {string} die `sim_version`-Spalte der Zeile
 */
function simVersionOf(db, id) {
  const row = db
    .prepare('SELECT sim_version FROM raid_snapshots WHERE id = ?')
    .get(id)
  if (!row) throw new Error(`Snapshot ${id} fehlt`)
  return String(row.sim_version)
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} id
 * @returns {number} die `contractVersion` im Payload
 */
function contractVersionOf(db, id) {
  const row = db
    .prepare('SELECT payload_json FROM raid_snapshots WHERE id = ?')
    .get(id)
  if (!row) throw new Error(`Snapshot ${id} fehlt`)
  return JSON.parse(String(row.payload_json)).contractVersion
}

describe('Migration auf Contract v6', () => {
  it('hebt einen v5-Stand an, statt ihn zu löschen', () => {
    const db = databaseWith(toV5)
    snapshot(db, 'v5', '0.0.4', 5)
    openJob(db, 'job-v5', 'v5', 'player-1')
    db.exec(toV6)

    expect(simVersionOf(db, 'v5')).toBe(sim_version)
    expect(contractVersionOf(db, 'v5')).toBe(6)
    // Der Job bleibt: sein Ergebnis ist unter demselben Kampfmodell gerechnet.
    expect(jobById(db, 'job-v5')).toBeTruthy()
    db.close()
  })

  it('lässt eine spätere Version unberührt', () => {
    const db = databaseWith(toV5)
    snapshot(db, 'later', '0.0.6', 7)
    db.exec(toV6)
    expect(simVersionOf(db, 'later')).toBe('0.0.6')
    expect(contractVersionOf(db, 'later')).toBe(7)
    db.close()
  })

  it('legt die Unveränderlichkeitstrigger wieder an', () => {
    const db = databaseWith(toV5)
    snapshot(db, 'v5', '0.0.4', 5)
    db.exec(toV6)
    expect(() =>
      db.prepare('DELETE FROM raid_snapshots WHERE id = ?').run('v5'),
    ).toThrow(/immutable/)
    db.close()
  })
})
