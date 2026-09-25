# packages/server/docs/ARCHITEKTUR.md

## Rolle

Autoritative Instanz für Defender-State, Pool, Validierung und Progression-Tor. Dieser Stand implementiert ausschließlich die D1-nahe Snapshot-/Job-Persistenz.

## `db` als Owner

`src/db` besitzt das ausführbare D1-Migration-Schema, den strukturellen D1-Port, die Raid-Store-API und die Job-Statusdaten. `sync`, `matchmaking`, HTTP, Queue und Combat importieren diese Typen später über `@floor/server`; sie besitzen keine eigene Statuslogik.

### Resultierende Modulstruktur

- `raid-commit.ts` besitzt nur den atomaren Upload-/Snapshot-Commit.
- `raid-store.ts` besitzt die öffentliche Commit-/Transition-/Expiry-API.
- `raid-queries.ts` ist der einzige Owner für D1-Statements und typisierte Reads.
- `raid-records.ts` übersetzt D1-Zeilen in öffentliche camelCase-Records und validiert Commit-Eingaben.
- `job-state.ts` besitzt Statusnamen, TTL und Terminaldaten; die erlaubten DB-Übergänge besitzt ausschließlich der Migration-Trigger.
- Tests verwenden einen schlanken transaktionalen SQLite-D1-Adapter statt eines zweiten Zustandsmodells.

- `001_raid_jobs.sql` legt `raid_snapshots`, `raid_jobs`, Unveränderlichkeits-Trigger, TTL- und Slot-Constraints an.
- Der vollständige `RaidSnapshot` wird vor D1-Zugriff über Contract v2 validiert.
- Der Store persistiert genau `resources`, `monsterSlots`, `activeTeam` und `dungeon`. Upload-Taktiken werden nicht als Teil des Raid-Freeze gespeichert.
- Ein einzelner D1-Batch beendet fällige Altjobs und committet Snapshot plus `accepted`-Job. Bei jeder Batch-Abweichung bleibt der vorherige Zustand erhalten.
- `idempotencyKey` ist zugleich Snapshot-/Job-ID. Gleiche Schlüssel+Daten liefern denselben Job; abweichende Daten oder ein bereits offener Job desselben Angreifers ergeben einen Fehler.
- `raid_jobs.snapshot_id` referenziert den unveränderlichen Angreifer-Freeze.
- `raid_jobs.target_snapshot_id` ist initially `NULL`, referenziert später einen eigenen unveränderlichen Ziel-Freeze und ist nach dem ersten Setzen nicht mehr änderbar. Matching und das Setzen der Referenz sind nicht Teil dieses Passes.
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
- Die Fach-TTL beträgt exakt 900.000 ms ab Commit. Ein fälliger Job wird beim Ablauf hart `expired`; Completion nach Ablauf ist unmöglich.

## Noch nicht implementiert

Queue/HTTP/Auth, Zielauswahl und Ghost, Replay, Resultatberechnung, RLE+deflate sowie Shield-/Wett-/XP-Effekte gehören nicht zu diesem Pass.
