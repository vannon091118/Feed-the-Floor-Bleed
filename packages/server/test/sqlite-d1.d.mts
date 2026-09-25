import type { D1Database, D1PreparedStatement, D1Result } from '../src/db/d1'

export declare class SqliteD1 implements D1Database {
  batchCalls: number
  prepare(query: string): D1PreparedStatement
  batch<T = Record<string, unknown>>(
    statements: D1PreparedStatement[],
  ): Promise<D1Result<T>[]>
  hasSnapshot(id: string): boolean
  hasJob(id: string): boolean
}
