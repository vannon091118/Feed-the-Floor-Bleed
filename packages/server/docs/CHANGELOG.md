# packages/server/docs/CHANGELOG.md

## 2026-09-25 — T1.3 Zustandsvokabular aus dem Contract

- `src/db/job-state.ts` importiert `RAID_JOB_STATUSES`, `RAID_JOB_TTL_MS`, `canTransitionRaidJob`, `RaidJobStatus` und `ErrorCodeSchema` aus `@floor/contracts` und re-exportiert sie für `@floor/server/db`. Vorher standen dieselben Werte an drei Stellen, mit der Folge, dass `timeout` in D1 möglich, im Contract aber nicht darstellbar war.
- `assertFailureCode` ergänzt: ein `failureCode`, der nicht zum Contract-Vokabular gehört, wird als `INVALID_INPUT` abgewiesen. Der D1-Trigger bleibt die Datenbanksperre, ist aber nicht mehr die einzige Definition.
- `raid-store.ts` prüft den Übergang jetzt vor dem Schreibzugriff mit `canTransitionRaidJob`. Der Fehler ist dadurch vor der DB-Zuweisung klar; `INVALID_TRANSITION` bleibt der Code.
- Der Test nutzt `blocked` und `invalid-hash` statt freier Strings. Die alte Fassung belegte den Drift: `replay-invalid` war in D1 geduldet, im Contract nicht.
- Keine neuen Endpunkte, keine Queue, kein HTTP, kein Combat im Server.

## 2026-09-25 — D1-Architekturpass

- `raid-reads.ts` und `statements.ts` zu einem SQL-/Read-Owner `raid-queries.ts` zusammengeführt.
- Übergangsregel aus TypeScript entfernt; der D1-Migration-Trigger ist der einzige Statusübergangs-Owner.
- Handgeschriebenen 170-Zeilen-D1-Fake durch einen transaktionalen SQLite-D1-Adapter ersetzt.
- Verhalten, Schema und Verträge unverändert gelassen.

## 2026-09-25 — Vollständiger Raid-Freeze / SPEC-Lücke

- D1-Persistenz von Contract-v1-Upload auf den vollständigen kanonischen Contract-v2-Raid-Freeze umgestellt.
- Atomarer Commit speichert nun Ressourcen, fünf Monster-Slots, aktive Helden mit temporärer Müdigkeit und Verletzung sowie Dungeon; Taktiken bleiben außen vor.
- `raid_jobs.target_snapshot_id` als nullable eindeutiger FK ergänzt und nach erstem Setzen per Trigger unveränderlich gemacht.
- Contract-, Commit- und SQLite-Migrationstests für Vollständigkeit, v1-Ablehnung und Zielverknüpfung ergänzt.
- Matching, Zielauswahl, Queue, HTTP, Auth, Replay und Gameplay-Effekte bleiben unimplementiert.

## 2026-09-25 — D1-Raid-Persistenz

- Unveränderliche Snapshot-Tabelle samt Upload-Contract, `sim_version` und JSON-Validierung ergänzt.
- Raid-Job-Tabelle mit explizitem Statusautomaten, Revision, Terminalmetadaten und 900.000-ms-TTL implementiert.
- Atomarer D1-Batch für Ablauf, Snapshot und `accepted`-Job sowie partieller Unique-Index für einen offenen Job pro Angreifer ergänzt.
- Idempotente Commits, konditionale Übergänge, harter Timeout und verständliche Store-Fehler umgesetzt.
- Commit-, Slot-, Rollback-, Transitions-, TTL- und Migrationstests ergänzt.
- Queue, HTTP, Auth, Matching, Ghost, Replay, RLE+deflate und Gameplay-Effekte bleiben unimplementiert.

## 2026-09-25 — Cloudflare-first Backendentscheidung

- D1 speichert Jobstatus, Snapshot-Metadaten und die 15-Minuten-Frist; Queues übergeben den Raid-Job an den Headless-Worker.
- Die frühere Zielnotiz „Node 22 + Fastify + better-sqlite3 + Caddy“ bleibt historischer Initialstand und ist keine aktuelle Architektur.

## 2026-09-25 — Init

- Domäne angelegt: `db`, `matchmaking`, `sync`.
- Ziel: Node 22 + Fastify + better-sqlite3 + Caddy, Replay in worker_threads.
