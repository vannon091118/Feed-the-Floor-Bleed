import { describe, expect, it } from 'vitest'
import {
  contractVersionOf,
  databaseWith,
  jobById,
  migration,
  openJob,
  simVersionOf,
  snapshot,
} from './migration-fixtures.mjs'

const toV5 = migration('003_contract_v5.sql')
const toV6 = migration('004_contract_v6.sql')
const toV7 = migration('005_contract_v7.sql')

describe('Migration auf Contract v7', () => {
  it('hebt einen v6-Stand an, statt ihn zu löschen', () => {
    const db = databaseWith(toV5, toV6)
    snapshot(db, 'v6', '0.0.5', 6)
    openJob(db, 'job-v6', 'v6', 'player-1')
    db.exec(toV7)

    // Der Wert der abgelösten Ära, nicht der aktuelle: `005` ist eine
    // Momentaufnahme des Sprungs 6→7 und wird bei späteren Sprüngen nicht
    // angepasst. Die aktuelle Version prüft der Test der neuesten Migration.
    expect(simVersionOf(db, 'v6')).toBe('0.0.6')
    expect(contractVersionOf(db, 'v6')).toBe(7)
    // Der Job bleibt: der eingefrorene Stand ist in v7 unverändert lesbar.
    expect(jobById(db, 'job-v6')).toBeTruthy()
    db.close()
  })

  it('lässt eine spätere Version unberührt', () => {
    const db = databaseWith(toV5, toV6)
    snapshot(db, 'later', '0.0.7', 8)
    db.exec(toV7)
    expect(simVersionOf(db, 'later')).toBe('0.0.7')
    expect(contractVersionOf(db, 'later')).toBe(8)
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
