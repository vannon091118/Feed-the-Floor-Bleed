# packages/server/docs/REPOINDEX.md

| Pfad | Job |
|------|-----|
| `migrations/001_raid_jobs.sql` | D1-Tabellen, Trigger, vollständiger Freeze, Ziel-FK, TTL-, Status- und Slot-Constraints |
| `migrations/002_contract_v4.sql` | Entfernt v3-Zeilen samt abhängigen Jobs und legt die Unveränderlichkeitstrigger wieder an |
| `migrations/003_contract_v5.sql` | Entfernt die v4-Ära (`simVersion 0.0.3`) samt abhängigen Jobs und legt die Unveränderlichkeitstrigger wieder an |
| `migrations/004_contract_v6.sql` | Hebt die v5-Zeilen auf `simVersion 0.0.5` und `contractVersion 6` an, ohne Daten zu verlieren; das neue `generation`-Feld ist optional |
| `migrations/005_contract_v7.sql` | Hebt die v6-Zeilen auf `simVersion 0.0.6` und `contractVersion 7` an, ohne Daten zu verlieren; das Kampfmodell ändert sich, die eingefrorene Eingabe nicht |
| `migrations/006_contract_v8.sql` | Hebt die v7-Zeilen auf `simVersion 0.0.7` und `contractVersion 8` an, ohne Daten zu verlieren; `behavior` und die profilabhängige Zielwahl verschieben die Hashes der Epoche |
| `src/db/d1.ts` | Minimale strukturelle D1-Port-Typen |
| `src/db/raid-checkpoint.ts` | Atomarer vollständiger Snapshot-/Job-Sync-Checkpoint und Idempotenz |
| `src/db/raid-store.ts` | Öffentliche Checkpoint-/Transition-/Expiry-API |
| `src/db/raid-records.ts` | D1-Zeilen, öffentliche Records, Snapshot-Mapping und Eingabeprüfung |
| `src/db/raid-queries.ts` | Einziger Owner für D1-Statements und typisierte Reads |
| `src/db/job-state.ts` | Re-Exports des Contract-Vokabulars, terminale Datenregeln, Fehlercode-Prüfung |
| `src/db/errors.ts` | Verständliche Persistenzfehler |
| `src/db/*.test.*` | Vollständigkeits-, Checkpoint-, Ziel-, Idempotenz-, Zustands-, TTL- und Migrationstests; `raid-migration-v4.test.mjs` bis `raid-migration-v8.test.mjs` prüfen je Migration getrennt, inklusive Kettenlauf |
| `src/db/migration-fixtures.mjs` | Gemeinsames Gerüst der Migrationsprüfungen: Datenbank, Migrationskette, Snapshot und Job, Versionsleser |
| `src/worker.ts` | Worker-Rand für `feed-the-floor-bleed.vannon-fs.workers.dev`: `/api/health`, `/api/sync/checkpoint`, `/api/sync/job/:id` |
| `src/worker.test.ts` | Randtests gegen den SQLite-D1-Doppel: Health, 503 ohne D1, Idempotenz, 409, 404, 400/405 |
| `test/sqlite-d1.mjs` | Schlanker transaktionaler SQLite-D1-Testadapter |
| `test/raid-fixtures.ts` | Vollständige Raid-Snapshots in der aktuellen Contract-Version |
| `src/matchmaking/` | Pool, Zielauswahl, Ghost — noch leer |
| `src/sync/` | Queue, Token, Replay — noch leer; der HTTP-Rand liegt in `src/worker.ts` |
