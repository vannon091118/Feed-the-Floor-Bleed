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

/** Der Stand, den `005` herstellt: beide Felder auf dem aktuellen Wert. */
const current = { simVersion: sim_version, contractVersion: CONTRACT_VERSION }

describe('Migration auf Contract v7', () => {
  it('hebt einen v6-Stand an, statt ihn zu löschen', () => {
    const db = databaseWith(toV5, toV6)
    snapshot(db, 'v6', '0.0.5', 6)
    openJob(db, 'job-v6', 'v6', 'player-1')
    db.exec(toV7)

    expect(versionsOf(db, 'v6')).toEqual(current)
    // Der Job bleibt: der eingefrorene Stand ist in v7 unverändert lesbar.
    expect(jobById(db, 'job-v6')).toBeTruthy()
    db.close()
  })

  it('lässt eine spätere Version unberührt', () => {
    const db = databaseWith(toV5, toV6)
    snapshot(db, 'later', '0.0.7', 8)
    db.exec(toV7)
    expect(versionsOf(db, 'later')).toEqual({
      simVersion: '0.0.7',
      contractVersion: 8,
    })
    db.close()
  })

  it('legt die Unveränderlichkeitstrigger wieder an', () => {
    const db = databaseWith(toV5, toV6)
    snapshot(db, 'v6', '0.0.5', 6)
    db.exec(toV7)
    expect(() =>
      db.prepare('DELETE FROM raid_snapshots WHERE id = ?').run('v6'),
    ).toThrow(/immutable/)
    db.close()
  })
})
