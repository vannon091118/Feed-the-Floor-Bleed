import { CONTRACT_VERSION, sim_version } from '@floor/contracts'
import { describe, expect, it } from 'vitest'
import {
  databaseWith,
  jobById,
  migration,
  openJob,
  snapshot,
  versionsOf,
} from './migration-fixtures.mjs'

const toV5 = migration('003_contract_v5.sql')
const toV6 = migration('004_contract_v6.sql')
const toV7 = migration('005_contract_v7.sql')
const toV8 = migration('006_contract_v8.sql')

/** Der Stand, den `006` herstellt: beide Felder auf dem aktuellen Wert. */
const current = { simVersion: sim_version, contractVersion: CONTRACT_VERSION }

describe('Migration auf Contract v8', () => {
  it('hebt einen v7-Stand an, statt ihn zu löschen', () => {
    const db = databaseWith(toV5, toV6, toV7)
    snapshot(db, 'v7', '0.0.6', 7)
    openJob(db, 'job-v7', 'v7', 'player-1')
    db.exec(toV8)

    expect(versionsOf(db, 'v7')).toEqual(current)
    // Der Job bleibt: die eingefrorene Eingabe ist in v8 unverändert lesbar.
    expect(jobById(db, 'job-v7')).toBeTruthy()
    db.close()
  })

  it('lässt eine spätere Version unberührt', () => {
    const db = databaseWith(toV5, toV6, toV7)
    snapshot(db, 'later', '0.0.8', 9)
    db.exec(toV8)
    expect(versionsOf(db, 'later')).toEqual({
      simVersion: '0.0.8',
      contractVersion: 9,
    })
    db.close()
  })

  it('legt die Unveränderlichkeitstrigger wieder an', () => {
    const db = databaseWith(toV5, toV6, toV7)
    snapshot(db, 'v7', '0.0.6', 7)
    db.exec(toV8)
    expect(() =>
      db.prepare('DELETE FROM raid_snapshots WHERE id = ?').run('v7'),
    ).toThrow(/immutable/)
    db.close()
  })
})
