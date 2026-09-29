import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { sim_version } from '@floor/contracts'
import { describe, expect, it } from 'vitest'

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite')

const schema = readFileSync(
  new URL('../../migrations/001_raid_jobs.sql', import.meta.url),
  'utf8',
)
const rebuild = readFileSync(
  new URL('../../migrations/002_contract_v4.sql', import.meta.url),
  'utf8',
)

/**
 * Legt einen Snapshot an. `contractVersion` steht im Payload, `simVersion` als
 * eigene Spalte — genau so, wie der Checkpoint ihn schreibt.
 *
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} id
 * @param {string} simVersion
 * @param {number} contractVersion
 */
function snapshot(db, id, simVersion, contractVersion) {
  db.prepare(
    'INSERT INTO raid_snapshots (id, request_key, sim_version, payload_json, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, id, simVersion, `{"contractVersion":${contractVersion}}`, 0)
}

/**
 * Legt einen offenen Job an; der Ziel-Snapshot ist optional, weil ein Job ohne
 * Ziel der Normalfall eines lokalen Fixture-Laufs ist.
 *
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} id
 * @param {string} snapshotId
 * @param {string | null} targetSnapshotId
 * @param {string} attackerId
 */
function openJob(db, id, snapshotId, targetSnapshotId, attackerId) {
  db.prepare(
    "INSERT INTO raid_jobs (id, snapshot_id, target_snapshot_id, attacker_id, status, created_at, updated_at, expires_at) VALUES (?, ?, ?, ?, 'accepted', ?, ?, ?)",
  ).run(id, snapshotId, targetSnapshotId, attackerId, 0, 0, 900000)
}

/**
 * Ein gemischter Bestand: zwei v3-Snapshots, ein Job, dessen Ziel-Snapshot
 * ebenfalls v3 ist, eine v4-fähige Zeile und eine Zeile einer **späteren**
 * Version, die diese Migration nichts angeht.
 *
 * @param {import('node:sqlite').DatabaseSync} db
 */
function fillMixedDatabase(db) {
  snapshot(db, 'v2-era', '0.0.1', 2)
  snapshot(db, 'v3-direct', '0.0.2', 3)
  snapshot(db, 'v3-target', '0.0.2', 3)
  snapshot(db, 'v4', sim_version, 4)
  snapshot(db, 'later', '0.0.4', 5)
  openJob(db, 'job-v3', 'v3-direct', 'v3-target', 'player-1')
  openJob(db, 'job-v4', 'v4', null, 'player-2')
  openJob(db, 'job-later', 'later', null, 'player-3')
}

/** @param {import('node:sqlite').DatabaseSync} db @param {string} id */
function snapshotById(db, id) {
  return db.prepare('SELECT id FROM raid_snapshots WHERE id = ?').get(id)
}

/** @param {import('node:sqlite').DatabaseSync} db @param {string} id */
function jobById(db, id) {
  return db.prepare('SELECT id FROM raid_jobs WHERE id = ?').get(id)
}

describe('Contract-v4-Migration', () => {
  it('entfernt v3-Zeilen samt abhängigen Jobs und lässt v4-Zeilen stehen', () => {
    const db = new DatabaseSync(':memory:')
    db.exec(schema)
    fillMixedDatabase(db)

    db.exec(rebuild)

    expect(snapshotById(db, 'v2-era')).toBeUndefined()
    expect(snapshotById(db, 'v3-direct')).toBeUndefined()
    expect(snapshotById(db, 'v3-target')).toBeUndefined()
    expect(snapshotById(db, 'v4')).toBeDefined()
    expect(jobById(db, 'job-v3')).toBeUndefined()
    expect(jobById(db, 'job-v4')).toBeDefined()
  })

  it('rührt Zeilen einer späteren Version nicht an', () => {
    const db = new DatabaseSync(':memory:')
    db.exec(schema)
    fillMixedDatabase(db)

    db.exec(rebuild)

    expect(snapshotById(db, 'later')).toBeDefined()
    expect(jobById(db, 'job-later')).toBeDefined()
  })

  it('legt die Unveränderlichkeitstrigger wieder an', () => {
    const db = new DatabaseSync(':memory:')
    db.exec(schema)
    fillMixedDatabase(db)

    db.exec(rebuild)

    expect(() =>
      db
        .prepare('UPDATE raid_snapshots SET payload_json = ? WHERE id = ?')
        .run('{}', 'v4'),
    ).toThrow(/immutable/)
    expect(() =>
      db.prepare('DELETE FROM raid_snapshots WHERE id = ?').run('v4'),
    ).toThrow(/immutable/)
  })
})
