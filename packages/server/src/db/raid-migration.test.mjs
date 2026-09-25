import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { INSERT_JOB } from './raid-queries'

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite')

const migration = readFileSync(
  new URL('../../migrations/001_raid_jobs.sql', import.meta.url),
  'utf8',
)

function database() {
  const db = new DatabaseSync(':memory:')
  db.exec(migration)
  return db
}

function insertSnapshot(db, id = 'snapshot-1', requestKey = id) {
  db.prepare(
    'INSERT INTO raid_snapshots (id, request_key, sim_version, payload_json, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, requestKey, '0.0.1', '{"contractVersion":1}', 0)
}

describe('D1-Raid-Migration', () => {
  it('macht Snapshots per Datenbank-Trigger unveränderlich', () => {
    const db = database()
    insertSnapshot(db)
    expect(() =>
      db
        .prepare('UPDATE raid_snapshots SET payload_json = ? WHERE id = ?')
        .run('{}', 'snapshot-1'),
    ).toThrow(/immutable/)
    expect(() =>
      db.prepare('DELETE FROM raid_snapshots WHERE id = ?').run('snapshot-1'),
    ).toThrow(/immutable/)
  })

  it('führt den idempotenten Job-Insert gegen SQLite aus', () => {
    const db = database()
    const payload = '{"contractVersion":1}'
    db.prepare(
      'INSERT INTO raid_snapshots (id, request_key, sim_version, payload_json, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run('job-1', 'job-1', '0.0.1', payload, 0)
    const insert = db.prepare(INSERT_JOB)
    const values = [
      'job-1',
      'job-1',
      'player-1',
      0,
      0,
      900000,
      'job-1',
      'job-1',
      '0.0.1',
      payload,
    ]
    expect(insert.run(...values).changes).toBe(1)
    expect(insert.run(...values).changes).toBe(0)
  })

  it('erlaubt genau eine unveränderliche Ziel-Snapshot-Verknüpfung', () => {
    const db = database()
    insertSnapshot(db)
    insertSnapshot(db, 'attacker-2', null)
    insertSnapshot(db, 'target-1', null)
    insertSnapshot(db, 'target-2', null)
    db.prepare(
      "INSERT INTO raid_jobs (id, snapshot_id, attacker_id, status, created_at, updated_at, expires_at) VALUES (?, ?, ?, 'accepted', ?, ?, ?)",
    ).run('job-1', 'snapshot-1', 'player-1', 0, 0, 900000)
    expect(
      db
        .prepare('SELECT target_snapshot_id FROM raid_jobs WHERE id = ?')
        .get('job-1').target_snapshot_id,
    ).toBeNull()
    db.prepare('UPDATE raid_jobs SET target_snapshot_id = ? WHERE id = ?').run(
      'target-1',
      'job-1',
    )
    expect(() =>
      db
        .prepare(
          "INSERT INTO raid_jobs (id, snapshot_id, target_snapshot_id, attacker_id, status, created_at, updated_at, expires_at) VALUES (?, ?, ?, ?, 'accepted', ?, ?, ?)",
        )
        .run('job-2', 'attacker-2', 'target-1', 'player-2', 0, 0, 900000),
    ).toThrow(/raid_jobs\.target_snapshot_id/)
    expect(() =>
      db
        .prepare('UPDATE raid_jobs SET target_snapshot_id = ? WHERE id = ?')
        .run('target-2', 'job-1'),
    ).toThrow(/target snapshot is immutable/)
  })

  it('erzwingt 15-Minuten-TTL, Statusdaten und einen offenen Job', () => {
    const db = database()
    insertSnapshot(db)
    insertSnapshot(db, 'snapshot-2')
    insertSnapshot(db, 'snapshot-3')
    const insertJob = db.prepare(
      "INSERT INTO raid_jobs (id, snapshot_id, attacker_id, status, created_at, updated_at, expires_at) VALUES (?, ?, ?, 'accepted', ?, ?, ?)",
    )
    insertJob.run('job-1', 'snapshot-1', 'player-1', 0, 0, 900000)
    expect(() =>
      insertJob.run('job-2', 'snapshot-2', 'player-1', 0, 0, 900000),
    ).toThrow(/raid_jobs\.attacker_id/)
    expect(() =>
      insertJob.run('job-3', 'snapshot-3', 'player-2', 0, 0, 899999),
    ).toThrow(/CHECK constraint failed/)
    expect(() =>
      db
        .prepare("UPDATE raid_jobs SET status = 'completed' WHERE id = ?")
        .run('job-1'),
    ).toThrow(/invalid job status transition/)
    expect(() =>
      db
        .prepare(
          "INSERT INTO raid_jobs (id, snapshot_id, attacker_id, status, created_at, updated_at, expires_at, result_json) VALUES (?, ?, ?, 'completed', ?, ?, ?, ?)",
        )
        .run('job-3', 'snapshot-3', 'player-2', 0, 0, 900000, '[]'),
    ).toThrow(/CHECK constraint failed/)
  })
})
