import { describe, expect, it } from 'vitest'
import {
  contractVersionOf,
  databaseWith,
  migration,
  simVersionOf,
  snapshot,
} from './migration-fixtures.mjs'

const toV5 = migration('003_contract_v5.sql')
const toV6 = migration('004_contract_v6.sql')

describe('Migration auf Contract v6', () => {
  it('hebt einen v5-Stand an, statt ihn zu löschen', () => {
    const db = databaseWith(toV5)
    snapshot(db, 'v5', '0.0.4', 5)
    db.exec(toV6)

    // Der Wert der abgelösten Ära, nicht der aktuelle: `004` ist eine
    // Momentaufnahme des Sprungs 5→6 und wird bei späteren Sprüngen nicht
    // angepasst. Die aktuelle Version prüft der Test der neuesten Migration.
    expect(simVersionOf(db, 'v5')).toBe('0.0.5')
    expect(contractVersionOf(db, 'v5')).toBe(6)
    // Dass ein abhängiger Job die Hebung überlebt, belegen dieselbe Mechanik
    // (UPDATE statt DELETE) die Tests 005 bis 006 — dort steht der Job je
    // Kette einmal; zwei Zeilen wären hier dieselbe Prüfung zum dritten Mal.
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
