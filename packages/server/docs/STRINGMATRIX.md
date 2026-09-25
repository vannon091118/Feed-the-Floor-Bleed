# packages/server/docs/STRINGMATRIX.md

## D1-Tabellen

| Schlüssel | Bedeutung |
|-----------|-----------|
| `db/raid_snapshots` | Unveränderlicher Contract-v2-Raid-Freeze als JSON: Ressourcen, fünf Monster-Slots, aktive Helden mit temporären Zuständen, Dungeon, `sim_version` |
| `db/raid_jobs.snapshot_id` | Unveränderlicher Angreifer-Freeze des Jobs |
| `db/raid_jobs.target_snapshot_id` | Nullable, eindeutiger Ziel-Freeze; nach einmaligem Setzen unveränderlich |
| `db/one-open` | Partial Unique Index: höchstens ein `accepted|queued|running`-Job pro Angreifer |
| `db/expiration` | Index für Ablauf-Sweeps über Status und `expires_at` |

`request_key` ist beim Angreifer-Freeze der Idempotency-Key. Ziel-Snapshots haben keinen Request-Key und verwenden deshalb `NULL`.

## Jobstatus

| Status | Erlaubter Nachfolger | Terminaldaten |
|--------|----------------------|---------------|
| `accepted` | `queued`, `failed`, `expired` | keine |
| `queued` | `running`, `failed`, `expired` | keine |
| `running` | `completed`, `failed`, `expired` | keine |
| `completed` | keiner | `result_json` muss JSON-Objekt sein |
| `failed` | keiner | `failure_code` ist Pflicht |
| `expired` | keiner | `failure_code = "timeout"` |

`expires_at = created_at + 900000`. Ein Commit mit abgelaufenem offenem Job setzt diesen im selben Batch auf `expired`, bevor der neue Slot belegt wird.

## Persistenzfehler

| Fehlercode | Bedeutung |
|------------|-----------|
| `OPEN_JOB_CONFLICT` | Für den Angreifer besteht bereits ein offener Job |
| `IDEMPOTENCY_CONFLICT` | Schlüssel wurde mit anderen Upload-Daten wiederverwendet |
| `INVALID_TRANSITION` | Statusfolge, Revision oder TTL verbietet den Wechsel |
| `ATOMIC_COMMIT_FAILED` | D1-Batch wurde nicht vollständig ausgeführt |
| `JOB_NOT_FOUND` | Referenzierte Job-ID existiert nicht |
