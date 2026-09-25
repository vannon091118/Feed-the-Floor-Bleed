import { D1RaidStore } from '../src/db'
import { SqliteD1 } from './sqlite-d1.mjs'

export { upload } from '../../contracts/test/raid-fixtures'

export function setup() {
  const db = new SqliteD1()
  return { db, store: new D1RaidStore(db) }
}
