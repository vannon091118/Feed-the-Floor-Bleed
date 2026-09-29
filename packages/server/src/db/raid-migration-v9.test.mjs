import { describe, expect, it } from 'vitest'
import {
  databaseWith,
  jobById,
  MIGRATIONS,
  openJob,
  snapshot,
  versionsOf,
} from './migration-fixtures.mjs'

/**
 * Der Stand, den `007` herstellt — als **feste Zahl**, nicht als
 * `sim_version` aus den Contracts.
 *
 * `007_contract_v9.sql` ist laut eigenem Kommentar „eine Momentaufnahme des
 * Sprungs 8→9 und wird bei einem späteren Versionssprung nicht angepasst": sie
 * stempelt `'0.0.8'` als den Stand, den der Sprung 8→9 erzeugt hat. Bindet
 * sich dieser Test an die laufende Konstante, wird er bei jedem
 * `sim_version`-Sprung rot, obwohl sich an der Migration nichts geändert hat
 * — und der richtige Wert stünde dann nicht mehr dort, wo er hingehört.
 */
const v9 = { simVersion: '0.0.8', contractVersion: 9 }

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

    expect(versionsOf(db, 'v8')).toEqual(v9)
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
    snapshot(db, 'later', '0.0.10', 10)
    db.exec(MIGRATIONS.v9)
    expect(versionsOf(db, 'later')).toEqual({
      simVersion: '0.0.10',
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
