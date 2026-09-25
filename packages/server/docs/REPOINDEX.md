# packages/server/docs/REPOINDEX.md

| Pfad | Job |
|------|-----|
| `migrations/001_raid_jobs.sql` | D1-Tabellen, Trigger, vollständiger Freeze, Ziel-FK, TTL-, Status- und Slot-Constraints |
| `src/db/d1.ts` | Minimale strukturelle D1-Port-Typen |
| `src/db/raid-commit.ts` | Atomarer vollständiger Snapshot-/Job-Commit und Idempotenz |
| `src/db/raid-store.ts` | Öffentliche Commit-/Transition-/Expiry-API |
| `src/db/raid-records.ts` | D1-Zeilen, öffentliche Records, Snapshot-Mapping und Eingabeprüfung |
| `src/db/raid-queries.ts` | Einziger Owner für D1-Statements und typisierte Reads |
| `src/db/job-state.ts` | Statusnamen, terminale Datenregeln und 15-Minuten-TTL |
| `src/db/errors.ts` | Verständliche Persistenzfehler |
| `src/db/*.test.*` | Vollständigkeits-, Commit-, Ziel-, Idempotenz-, Zustands-, TTL- und Migrationstests |
| `test/sqlite-d1.mjs` | Schlanker transaktionaler SQLite-D1-Testadapter |
| `test/raid-fixtures.ts` | Vollständige Contract-v2-Raid-Snapshots |
| `src/matchmaking/` | Pool, Zielauswahl, Ghost — noch leer |
| `src/sync/` | HTTP, Upload, Results, Token, Replay — noch leer |
