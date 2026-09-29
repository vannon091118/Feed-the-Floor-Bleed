import { sim_version } from '@floor/contracts'
import { describe, expect, it } from 'vitest'
import {
  DatabaseSync,
  jobById,
  migration,
  openJob,
  snapshot,
  snapshotById,
} from './migration-fixtures.mjs'

const schema = migration('001_raid_jobs.sql')
const toV4 = migration('002_contract_v4.sql')
const toV5 = migration('003_contract_v5.sql')

/**
 * Ein gemischter Bestand: die v4-Ära (`0.0.3`), der aktuelle Stand und eine
 * Zeile einer **späteren** Version, die diese Migration nichts angeht.
 *
 * @param {import('node:sqlite').DatabaseSync} db
 */
function fillMixedDatabase(db) {
  snapshot(db, 'v4-direct', '0.0.3', 4)
  snapshot(db, 'v5', sim_version, 5)
  snapshot(db, 'later', '0.0.5', 6)
  openJob(db, 'job-v4', 'v4-direct', 'player-1')
  openJob(db, 'job-v5', 'v5', 'player-2')
  openJob(db, 'job-later', 'later', 'player-3')
}

describe('Contract-v5-Migration', () => {
  it('entfernt die v4-Ära samt abhängigen Jobs und lässt den aktuellen Stand stehen', () => {
    const db = new DatabaseSync(':memory:')
    db.exec(schema)
    fillMixedDatabase(db)

    db.exec(toV5)

    expect(snapshotById(db, 'v4-direct')).toBeUndefined()
    expect(jobById(db, 'job-v4')).toBeUndefined()
    expect(snapshotById(db, 'v5')).toBeDefined()
    expect(jobById(db, 'job-v5')).toBeDefined()
  })

  it('rührt Zeilen einer späteren Version nicht an', () => {
    const db = new DatabaseSync(':memory:')
    db.exec(schema)
    fillMixedDatabase(db)

    db.exec(toV5)

    expect(snapshotById(db, 'later')).toBeDefined()
    expect(jobById(db, 'job-later')).toBeDefined()
  })

  it('überlässt die älteren Bestände der Vorgängermigration', () => {
    // Das Prädikat nennt die abgelöste Version ausdrücklich. Ein
    // `sim_version <> '0.0.4'` hätte hier still auch die v3-Ära gelöscht, die
    // 002 gehört — und in einer späteren Codebasis deren Zeilen gleich mit.
    const db = new DatabaseSync(':memory:')
    db.exec(schema)
    snapshot(db, 'v3-era', '0.0.2', 3)

    db.exec(toV5)

    expect(snapshotById(db, 'v3-era')).toBeDefined()
  })

  it('legt die Unveränderlichkeitstrigger wieder an', () => {
    const db = new DatabaseSync(':memory:')
    db.exec(schema)
    fillMixedDatabase(db)

    db.exec(toV5)

    expect(() =>
      db
        .prepare('UPDATE raid_snapshots SET payload_json = ? WHERE id = ?')
        .run('{}', 'v5'),
    ).toThrow(/immutable/)
    expect(() =>
      db.prepare('DELETE FROM raid_snapshots WHERE id = ?').run('v5'),
    ).toThrow(/immutable/)
  })

  it('führt die Kette 001 → 002 → 003 zu einem einheitlichen Bestand', () => {
    const db = new DatabaseSync(':memory:')
    db.exec(schema)
    snapshot(db, 'v2-era', '0.0.1', 2)
    snapshot(db, 'v3-era', '0.0.2', 3)
    snapshot(db, 'v4-era', '0.0.3', 4)
    snapshot(db, 'v5', sim_version, 5)

    db.exec(toV4)
    db.exec(toV5)

    expect(snapshotById(db, 'v2-era')).toBeUndefined()
    expect(snapshotById(db, 'v3-era')).toBeUndefined()
    expect(snapshotById(db, 'v4-era')).toBeUndefined()
    expect(snapshotById(db, 'v5')).toBeDefined()
  })
})
