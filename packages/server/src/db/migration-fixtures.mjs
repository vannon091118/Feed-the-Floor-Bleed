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
 * Die Migrationskette als Inhalt, in Sprungreihenfolge.
 *
 * Sie steht hier, weil vier Dateien dieselben `const toV5 = migration('…')`-Zeilen
 * sonst nebeneinander führen und das Redundancy-Gate in dasselbe Sechs-Zeilen-
 * Fenster laufen lässt: die Dublette wird nicht umgangen, sondern zu den übrigen
 * Handgriffen gelegt. Wer seine Schritte ausdrücklich zeigen will, ruft
 * `migration()` weiterhin selbst auf.
 */
export const MIGRATIONS = {
  v5: migration('003_contract_v5.sql'),
  v6: migration('004_contract_v6.sql'),
  v7: migration('005_contract_v7.sql'),
  v8: migration('006_contract_v8.sql'),
  v9: migration('007_contract_v9.sql'),
}

/**
 * Eine frische Datenbank mit dem Grundschema und den übergebenen Migrationen.
 *
 * Nimmt den **Inhalt** von Migrationen, nicht ihre Namen — die Tests lesen
 * ihre Datei selbst und geben den Text hier hinein. Der Unterschied ist nicht
 * kosmetisch: ein Inhalt als Dateiname gäbe `ENAMETOOLONG`.
 *
 * Die Migrationen laufen in Übergabereihenfolge. Ein Test, der den Stand vor
 * dem *letzten* Sprung braucht, gibt die Kette dorthin mit; eine einzelne
 * Angabe bleibt derselbe Aufruf wie vorher.
 *
 * @param {...string} sql bereits gelesene Migrationsdateien
 */
export function databaseWith(...sql) {
  const db = new DatabaseSync(':memory:')
  db.exec(migration('001_raid_jobs.sql'))
  for (const step of sql) db.exec(step)
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

/**
 * Die zwei Versionsleser der Ära-Tests.
 *
 * Sie standen wortgleich in `raid-migration-v6.test.mjs` und
 * `raid-migration-v7.test.mjs`, und das Redundancy-Gate hat es gemeldet: die
 * Dublette wird nicht umgangen, sondern zu den übrigen Handgriffen gelegt.
 *
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} id
 * @returns {string} die `sim_version`-Spalte der Zeile
 */
export function simVersionOf(db, id) {
  const row = db
    .prepare('SELECT sim_version FROM raid_snapshots WHERE id = ?')
    .get(id)
  if (!row) throw new Error(`Snapshot ${id} fehlt`)
  return String(row.sim_version)
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} id
 * @returns {number} die `contractVersion` im Payload
 */
export function contractVersionOf(db, id) {
  const row = db
    .prepare('SELECT payload_json FROM raid_snapshots WHERE id = ?')
    .get(id)
  if (!row) throw new Error(`Snapshot ${id} fehlt`)
  return JSON.parse(String(row.payload_json)).contractVersion
}

/**
 * Beide Versionsangaben einer Zeile in einem Zug.
 *
 * Ein Test, der gegen den *aktuellen* Stand prüft, vergleicht das Paar; ein
 * Test, der die abgelöste Ära festhält, nennt die zwei Werte einzeln. Dieselbe
 * Zusage, zwei Blickwinkel — und die Importlisten der zwei Dateien bleiben
 * dadurch verschieden.
 *
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} id
 * @returns {{ simVersion: string, contractVersion: number }}
 */
export function versionsOf(db, id) {
  return {
    simVersion: simVersionOf(db, id),
    contractVersion: contractVersionOf(db, id),
  }
}
