# packages/server/docs/STRINGMATRIX.md

## D1-Tabellen

| Schlüssel | Bedeutung |
|-----------|-----------|
| `db/raid_snapshots` | Unveränderlicher Contract-v4-Raid-Freeze als JSON: Ressourcen, fünf Monster-Slots, aktive Helden mit temporären Zuständen, Dungeon, `sim_version` |
| `db/raid_jobs.snapshot_id` | Unveränderlicher Angreifer-Freeze des Jobs |
| `db/raid_jobs.target_snapshot_id` | Nullable, eindeutiger Ziel-Freeze; nach einmaligem Setzen unveränderlich |
| `db/one-open` | Partial Unique Index: höchstens ein `accepted|queued|running`-Job pro Angreifer |
| `db/expiration` | Index für Ablauf-Sweeps über Status und `expires_at` |

`request_key` ist beim Angreifer-Freeze der Idempotency-Key. Ziel-Snapshots haben keinen Request-Key und verwenden deshalb `NULL`.

`002_contract_v4.sql` räumt Zeilen aus der Zeit vor Contract v4 ab. Der Filter ist `sim_version <> "0.0.3"`, also die Spalte und nicht der Payload: Sie ist der eingefrorene Stand der Simulation und stand schon in v3 als eigene Spalte. Der Schnitt läuft über `raid_snapshots` und die Jobs, die mit `snapshot_id` oder `target_snapshot_id` darauf zeigen; die Unveränderlichkeitstrigger werden dafür abgelegt und danach wortgleich neu angelegt.

## Jobstatus

| Status | Erlaubter Nachfolger | Terminaldaten |
|--------|----------------------|---------------|
| `accepted` | `queued`, `failed`, `expired` | keine |
| `queued` | `running`, `failed`, `expired` | keine |
| `running` | `completed`, `failed`, `expired` | keine |
| `completed` | keiner | `result_json` muss JSON-Objekt sein |
| `failed` | keiner | `failure_code` ist Pflicht |
| `expired` | keiner | `failure_code = "timeout"` |

Die Tabelle bildet `RAID_JOB_TRANSITIONS` aus `@floor/contracts` ab. `failed` akzeptiert nur `blocked`, `invalid-hash`, `invalid-request` oder `protected`; `timeout` ist ausschließlich `expired` vorbehalten. `assertFailureCode` erzwingt das vor dem Schreibzugriff.

`expires_at = created_at + 900000`. Ein Sync-Checkpoint mit abgelaufenem offenem Job setzt diesen im selben Batch auf `expired`, bevor der neue Slot belegt wird.

## Persistenzfehler

| Fehlercode | Bedeutung |
|------------|-----------|
| `OPEN_JOB_CONFLICT` | Für den Angreifer besteht bereits ein offener Job |
| `IDEMPOTENCY_CONFLICT` | Schlüssel wurde mit anderen Upload-Daten wiederverwendet |
| `INVALID_TRANSITION` | Statusfolge, Revision oder TTL verbietet den Wechsel |
| `ATOMIC_CHECKPOINT_FAILED` | D1-Batch wurde nicht vollständig ausgeführt |
| `JOB_NOT_FOUND` | Referenzierte Job-ID existiert nicht |

## HTTP-Rand

Der Worker setzt keinen eigenen Fehlercode, er bildet den Store-Fehlercode ab. `RaidStoreError` bleibt der einzige Wahrheitssprecher.

| Worker-Fehler | HTTP | Quelle |
|---------------|------|--------|
| `fehler: "SYNC_NICHT_VERBUNDEN"` | 503 | Keine D1-Bindung konfiguriert; das Spiel laeuft lokal weiter |
| `fehler: "UNGUELTIGE_ANFRAGE"` | 400 | Kaputter JSON-Body oder vom Contract abgelehnter Upload |
| `fehler: "METHODE_ERLAUBT"` | 405 | `/api/sync/checkpoint` ohne `POST` |
| `fehler: "UNBEKANNTE_ROUTE"` | 404 | Unbekannte `/api/*`-Route; ausserhalb von `/api/*` liefert die SPA `index.html` |
| `fehler: "SERVERFEHLER"` | 500 | Unerwarteter Fehler ohne Store-Herkunft |

| Store-Fehlercode | HTTP |
|-----------------|------|
| `OPEN_JOB_CONFLICT` | 409 |
| `IDEMPOTENCY_CONFLICT` | 409 |
| `INVALID_TRANSITION` | 409 |
| `INVALID_INPUT` | 400 |
| `JOB_NOT_FOUND` | 404 |
| `ATOMIC_CHECKPOINT_FAILED` | 500 |
