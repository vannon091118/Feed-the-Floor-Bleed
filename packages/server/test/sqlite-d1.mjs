import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite')
const migration = readFileSync(
  new URL('../migrations/001_raid_jobs.sql', import.meta.url),
  'utf8',
)

class BoundStatement {
  constructor(database, query, values = []) {
    this.database = database
    this.query = query
    this.values = values
  }
  bind(...values) {
    return new BoundStatement(this.database, this.query, values)
  }
  async first() {
    return this.database.raw.prepare(this.query).get(...this.values) ?? null
  }
  async run() {
    const result = this.database.raw.prepare(this.query).run(...this.values)
    return {
      success: true,
      results: [],
      meta: { changes: Number(result.changes) },
    }
  }
}

export class SqliteD1 {
  constructor() {
    this.raw = new DatabaseSync(':memory:')
    this.raw.exec(migration)
    this.batchCalls = 0
  }
  prepare(query) {
    return new BoundStatement(this, query)
  }
  async batch(statements) {
    this.batchCalls += 1
    this.raw.exec('BEGIN IMMEDIATE')
    try {
      const results = []
      for (const statement of statements) results.push(await statement.run())
      this.raw.exec('COMMIT')
      return results
    } catch (error) {
      this.raw.exec('ROLLBACK')
      throw error
    }
  }
  hasSnapshot(id) {
    return Boolean(
      this.raw.prepare('SELECT 1 FROM raid_snapshots WHERE id = ?').get(id),
    )
  }
  hasJob(id) {
    return Boolean(
      this.raw.prepare('SELECT 1 FROM raid_jobs WHERE id = ?').get(id),
    )
  }
}
