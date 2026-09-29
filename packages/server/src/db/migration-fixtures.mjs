import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite')

/**
 * Das gemeinsame Gerüst der Migrationsprüfungen.
 *
 * Die drei Tests zu Contract v4, v5 und v6 brauchen dieselben sechs Zeilen:
 * eine In-Memory-Datenbank, das Schema und eine Migrationsdatei lesen, einen
 * Snapshot und einen Job anlegen. Sie standen in jedem Test nebeneinander, und
 * das Redundancy-Gate hat es zu Recht gemeldet — die Dublette wird nicht
 * umgangen, sondern hierher gezogen, wo sie hingeshört.
 *
 * Der Import von `node:sqlite` ist absichtlich nicht global: nur wer
 * `DatabaseSync` braucht, holt es aus dieser Datei.
 */

/** @param {string} name @returns {string} */
export function migration(name) {
  return readFileSync(
    new URL(`../../migrations/${name}`, import.meta.url),
    'utf8',
  )
}

export { DatabaseSync }

/**
 * Eine frische Datenbank mit dem Grundschema.
 *
 * Nimmt den **Inhalt** einer Migration, nicht ihren Namen — die Tests lesen
 * ihre Datei selbst und geben den Text hier hinein. Der Unterschied ist nicht
 * kosmetisch: ein Inhalt als Dateiname gäbe `ENAMETOOLONG`.
 *
 * @param {string} sql eine bereits gelesene Migrationsdatei
 */
export function databaseWith(sql) {
  const db = new DatabaseSync(':memory:')
  db.exec(migration('001_raid_jobs.sql'))
  db.exec(sql)
  return db
}

/**
 * Legt einen Snapshot an. `contractVersion` steht im Payload, `simVersion` als
 * eigene Spalte — genau so, wie der Checkpoint ihn schreibt.
 *
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} id
 * @param {string} simVersion
 * @param {number} contractVersion
 */
export function snapshot(db, id, simVersion, contractVersion) {
  db.prepare(
    'INSERT INTO raid_snapshots (id, request_key, sim_version, payload_json, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, id, simVersion, `{"contractVersion":${contractVersion}}`, 0)
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} id
 * @param {string} snapshotId
 * @param {string} attackerId
 */
export function openJob(db, id, snapshotId, attackerId) {
  db.prepare(
    "INSERT INTO raid_jobs (id, snapshot_id, target_snapshot_id, attacker_id, status, created_at, updated_at, expires_at) VALUES (?, ?, NULL, ?, 'accepted', ?, ?, ?)",
  ).run(id, snapshotId, attackerId, 0, 0, 900000)
}

/** @param {import('node:sqlite').DatabaseSync} db @param {string} id */
export function snapshotById(db, id) {
  return db.prepare('SELECT id FROM raid_snapshots WHERE id = ?').get(id)
}

/** @param {import('node:sqlite').DatabaseSync} db @param {string} id */
export function jobById(db, id) {
  return db.prepare('SELECT id FROM raid_jobs WHERE id = ?').get(id)
}
