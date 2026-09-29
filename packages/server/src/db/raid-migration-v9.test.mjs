import { CONTRACT_VERSION, sim_version } from '@floor/contracts'
import { describe, expect, it } from 'vitest'
import {
  databaseWith,
  jobById,
  MIGRATIONS,
  openJob,
  snapshot,
  versionsOf,
} from './migration-fixtures.mjs'

/** Der Stand, den `007` herstellt: beide Felder auf dem aktuellen Wert. */
const current = { simVersion: sim_version, contractVersion: CONTRACT_VERSION }

describe('Migration auf Contract v9', () => {
  it('hebt einen v8-Stand an, statt ihn zu löschen', () => {
    const db = databaseWith(
      MIGRATIONS.v5,
      MIGRATIONS.v6,
      MIGRATIONS.v7,
      MIGRATIONS.v8,
    )
    snapshot(db, 'v8', '0.0.7', 8)
    openJob(db, 'job-v8', 'v8', 'player-1')
    db.exec(MIGRATIONS.v9)

    expect(versionsOf(db, 'v8')).toEqual(current)
    // Der Job bleibt: die eingefrorene Eingabe ist in v9 unverändert lesbar.
    expect(jobById(db, 'job-v8')).toBeTruthy()
    db.close()
  })

  it('lässt eine spätere Version unberührt', () => {
    const db = databaseWith(
      MIGRATIONS.v5,
      MIGRATIONS.v6,
      MIGRATIONS.v7,
      MIGRATIONS.v8,
    )
    snapshot(db, 'later', '0.0.9', 10)
    db.exec(MIGRATIONS.v9)
    expect(versionsOf(db, 'later')).toEqual({
      simVersion: '0.0.9',
      contractVersion: 10,
    })
    db.close()
  })

  it('legt die Unveränderlichkeitstrigger wieder an', () => {
    const db = databaseWith(
      MIGRATIONS.v5,
      MIGRATIONS.v6,
      MIGRATIONS.v7,
      MIGRATIONS.v8,
    )
    snapshot(db, 'v8', '0.0.7', 8)
    db.exec(MIGRATIONS.v9)
    expect(() =>
      db.prepare('DELETE FROM raid_snapshots WHERE id = ?').run('v8'),
    ).toThrow(/immutable/)
    db.close()
  })
})
