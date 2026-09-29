import { describe, expect, it } from 'vitest'
import {
  contractVersionOf,
  databaseWith,
  jobById,
  MIGRATIONS,
  openJob,
  simVersionOf,
  snapshot,
} from './migration-fixtures.mjs'

/** Die abgelöste Ära: der Stand, den `006` herstellt. */
const era = { simVersion: '0.0.7', contractVersion: 8 }

describe('Migration auf Contract v8', () => {
  it('hebt einen v7-Stand an, statt ihn zu löschen', () => {
    const db = databaseWith(MIGRATIONS.v5, MIGRATIONS.v6, MIGRATIONS.v7)
    snapshot(db, 'v7', '0.0.6', 7)
    openJob(db, 'job-v7', 'v7', 'player-1')
    db.exec(MIGRATIONS.v8)

    // Abgelöste Ära, nicht der heutige Stand: `006` ist eine Momentaufnahme des
    // Sprungs 7→8 und wird bei einem späteren Sprung nicht angepasst. Die
    // aktuelle Version prüft `raid-migration-v9.test.mjs`.
    expect(simVersionOf(db, 'v7')).toBe(era.simVersion)
    expect(contractVersionOf(db, 'v7')).toBe(era.contractVersion)
    // Der Job bleibt: die eingefrorene Eingabe ist in v8 unverändert lesbar.
    expect(jobById(db, 'job-v7')).toBeTruthy()
    db.close()
  })

  it('lässt eine spätere Version unberührt', () => {
    const db = databaseWith(MIGRATIONS.v5, MIGRATIONS.v6, MIGRATIONS.v7)
    snapshot(db, 'later', '0.0.8', 9)
    db.exec(MIGRATIONS.v8)
    expect(simVersionOf(db, 'later')).toBe('0.0.8')
    expect(contractVersionOf(db, 'later')).toBe(9)
    db.close()
  })

  it('legt die Unveränderlichkeitstrigger wieder an', () => {
    const db = databaseWith(MIGRATIONS.v5, MIGRATIONS.v6, MIGRATIONS.v7)
    snapshot(db, 'v7', '0.0.6', 7)
    db.exec(MIGRATIONS.v8)
    expect(() =>
      db.prepare('DELETE FROM raid_snapshots WHERE id = ?').run('v7'),
    ).toThrow(/immutable/)
    db.close()
  })
})
