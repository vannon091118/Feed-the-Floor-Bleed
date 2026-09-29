# packages/server/docs/ARCHITEKTUR.md

## Rolle

Autoritative Instanz für Defender-State, Pool, Validierung und Progression-Tor. Dieser Stand implementiert die D1-nahe Snapshot-/Job-Persistenz und den schmalen HTTP-Rand, über den Sync-Checkpoints entgegengenommen werden.

## `db` als Owner

`src/db` besitzt das ausführbare D1-Migration-Schema, den strukturellen D1-Port, die Raid-Store-API und die Durchsetzung der Job-Datenregeln. Die *Definition* von Status, Übergängen, TTL und Fehlercodes liegt seit T1.3 in `@floor/contracts`; `job-state.ts` importiert und re-exportiert sie. `sync`, `matchmaking`, HTTP, Queue und Combat importieren diese Typen später über `@floor/server`; sie besitzen keine eigene Statuslogik.

### Resultierende Modulstruktur

- `raid-checkpoint.ts` besitzt nur den atomaren Upload-/Snapshot-Sync-Checkpoint. Der frühere Name `raid-commit.ts` war irreführend: es ist weder ein Git-Commit noch ein Transaktions-Commit, sondern der Fortschrittspunkt, ab dem der hochgeladene Zustand als angekommen gilt.
- `raid-store.ts` besitzt die öffentliche Checkpoint-/Transition-/Expiry-API.
- `raid-queries.ts` ist der einzige Owner für D1-Statements und typisierte Reads.
- `job-state.ts` re-exportiert das Contract-Vokabular und erzwingt die terminalen Datenregeln inklusive Fehlercode-Prüfung.
- `raid-records.ts` übersetzt D1-Zeilen in öffentliche camelCase-Records und validiert Checkpoint-Eingaben.
- `job-state.ts` besitzt Statusnamen, TTL und Terminaldaten; die erlaubten DB-Übergänge besitzt ausschließlich der Migration-Trigger.
- Tests verwenden einen schlanken transaktionalen SQLite-D1-Adapter statt eines zweiten Zustandsmodells.

- `001_raid_jobs.sql` legt `raid_snapshots`, `raid_jobs`, Unveränderlichkeits-Trigger, TTL- und Slot-Constraints an.
- `002_contract_v4.sql` zieht den Bestand auf Contract v4 nach: Es entfernt Snapshots der abgelösten Simulationsversionen `0.0.1` und `0.0.2` samt den Jobs, die auf sie zeigen — genannt sind die Altsversionen ausdrücklich, damit ein erneuter Lauf keine Zeile einer späteren Codebasis trifft —, und legt die Unveränderlichkeitstrigger danach wieder an. Entfernt statt umgeschrieben, weil im `result_json` einer alten Nacht die Summary ohne `defendersTotal` steckt und der Kampflog dort nicht liegt — die Zahl der Verteidiger ist aus der Zeile nicht rekonstruierbar. Details im Domänen-Changelog.
- Der vollständige `RaidSnapshot` wird vor D1-Zugriff über Contract v4 validiert.
- Der Store persistiert genau `resources`, `monsterSlots`, `activeTeam` und `dungeon`. Upload-Taktiken werden nicht als Teil des Raid-Freeze gespeichert.
- Ein einzelner D1-Batch beendet fällige Altjobs und schreibt den Sync-Checkpoint aus Snapshot plus `accepted`-Job. Bei jeder Batch-Abweichung bleibt der vorherige Zustand erhalten.
- `idempotencyKey` ist zugleich Snapshot-/Job-ID. Gleiche Schlüssel+Daten liefern denselben Job; abweichende Daten oder ein bereits offener Job desselben Angreifers ergeben einen Fehler.
- `raid_jobs.snapshot_id` referenziert den unveränderlichen Angreifer-Freeze.
- `raid_jobs.target_snapshot_id` ist initially `NULL`, referenziert später den unveränderlichen Ziel-Freeze des verteidigenden Gegners (fremder Floor oder Ghost) und ist nach dem ersten Setzen nicht mehr änderbar. Matching und das Setzen der Referenz sind nicht Teil dieses Passes.
- Snapshots sind per SQLite-Trigger unveränderlich. Nur Jobstatus, Revisionszähler und terminale Ergebnismetadaten sind veränderlich.

## Zustandsautomat

```text
accepted → queued → running → completed
   └────────┴────────→ failed
accepted|queued|running → expired
```

- `completed` verlangt ein JSON-Objekt als Ergebnis.
- `failed` verlangt einen `failureCode`; `expired` setzt ausschließlich `timeout`.
- Terminale Zustände haben keine ausgehenden Übergänge.
- Jeder Übergang ist ein bedingtes `UPDATE` mit erwartetem Altstatus und `expires_at > now`; gleichzeitige konkurrierende Änderungen scheitern verständlich.
- Die Fach-TTL beträgt exakt 900.000 ms ab Sync-Checkpoint. Ein fälliger Job wird beim Ablauf hart `expired`; Completion nach Ablauf ist unmöglich.

## Worker-Rand

`src/worker.ts` ist der einzige Ort mit HTTP. Es ist ein dünner Rand: Er übersetzt Route und Fehlercode in HTTP, und jede fachliche Aussage kommt aus `db`. Er besitzt keine Statuslogik.

- `GET /api/health` meldet `syncAktiv` und bestaetigt `spiel: "lokal"`. Das ist der Aufruf, bei dem Worker-Zeit verbraucht wird.
- `POST /api/sync/checkpoint` nimmt `{ idempotencyKey, attackerId, upload }` und antwortet 201 (neu) oder 200 (idempotent). Der Zeitstempel kommt vom Server; ein Client, der `now` selbst waehlt, koennte sein eigenes Job-Fenster verlaengern.
- `GET /api/sync/job/:id` liest den geschriebenen Checkpoint zurueck.
- Der Worker laeuft nur fuer `/api/*` vor die Assets (`run_worker_first` in `wrangler.jsonc`). Das Spiel selbst kommt ueber die Asset-Kante aus und weckt ihn nie.
- Fehlt die D1-Bindung, antworten die Sync-Routen 503 und das Spiel laeuft weiter. Ein fehlender Sync darf keinen spielbaren Stand blockieren.

## Noch nicht implementiert

Queue/Auth, Zielauswahl und Ghost, Replay, Resultatberechnung, RLE+deflate sowie Shield-/Wett-/XP-Effekte gehören nicht zu diesem Pass. Der HTTP-Rand umfasst nur Aufruf und Sync-Checkpoint; er ist bewusst kein Spielprotokoll.
