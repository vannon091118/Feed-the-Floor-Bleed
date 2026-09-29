# packages/server/docs/CHANGELOG.md

## 2026-09-29 — Migration 005 zieht Contract v7 nach, ohne Daten zu verlieren

**Scope:** neu `migrations/005_contract_v7.sql` und `src/db/raid-migration-v7.test.mjs`. Geändert `src/db/migration-fixtures.mjs` (Migrationen als Kette, Versionsleser geteilt) und `src/db/raid-migration-v6.test.mjs`. Keine Route, kein Schema, keine Spalte geändert.

**Schreiben statt löschen, aus demselben Grund wie bei 004.** Ein v6-Snapshot ist die eingefrorene *Eingabe* — Ressourcen, Monster-Slots mit Generation, Heldenteam, Dungeon. Ihre Form ändert sich in v7 nicht: der Kampf wird beim Lesen und beim Replay gerechnet. Jede v6-Zeile ist damit semantisch eine v7-Zeile, und ein Löschvorgang vernichtete lesbare Daten.

**Was hier anders ist als bei v6, und warum es dasteht.** Das Kampfmodell ändert sich in v7 sehr wohl — die Bewegung, die Zonen und damit jeder Hash. Ein `result_json` aus der v6-Ära trägt deshalb einen Hash, den die neue Engine nicht mehr reproduziert. Er wird nirgends nachgerechnet: Das serverseitige Replay-Gate ist T3.2 und nicht gebaut, der Hash ist bis dahin Replay-Selbstkonsistenz in `sim-core`. Der Datensatz bleibt lesbar und in sich stimmig; die Epoche markiert das Versionsfeld, nicht die Löschung. Der Kopf der Migration spricht das aus, statt es zu verschweigen.

**Das Prädikat nennt die abgelöste Version ausdrücklich.** `005` fasst nur `sim_version IN ('0.0.5')` an, nie „alles außer der aktuellen". Der dritte Test des v6-Laufs bleibt damit gültig und ist unverändert: eine spätere Version überlebt. Seine Versionszusage vergleicht jetzt den Wert der *abgelösten* Ära (`0.0.5`) statt `sim_version` aus dem Contract — sonst hätte jeder folgende Sprung diesen Test rot gemacht; den aktuellen Wert prüft der Test der neuesten Migration.

**Zwei Dubletten sind aufgelöst, keine umgangen.** Die Versionsleser standen nach dem neuen Test doppelt in zwei Ära-Testdateien, und das Redundancy-Gate hat es gemeldet; `simVersionOf`/`contractVersionOf` liegen jetzt mit einem zusammenfassenden `versionsOf` in `migration-fixtures.mjs`. `databaseWith` nimmt dafür eine Kette von Migrationen entgegen (`databaseWith(toV5, toV6)`), weil der v7-Test den Stand *vor* seinem Sprung braucht; der Aufruf mit einer Datei bleibt derselbe.

**Gates:** typecheck 0, 474 Tests in 69 Dateien, Lint 0, LOC-Caps ok, Hygiene ok, Shinon PASS.

## 2026-09-29 — Migration 004 zieht Contract v6 nach, ohne Daten zu verlieren

**Scope:** neu `migrations/004_contract_v6.sql`, `src/db/raid-migration-v6.test.mjs` und `src/db/migration-fixtures.mjs`. Geändert `src/db/raid-migration-v5.test.mjs` (Helfer jetzt geteilt). Keine Route, kein Schema, keine Spalte geändert.

Diese Migration ist der erste Sprung, der **schreibt statt löscht**. `003` hat
die v4-Ära entfernt, weil eine v4-Zeile unter einem Routenmodell gerechnet war,
das es nicht mehr gibt. Für v6 gilt das nicht: das neue Feld `generation` am
`monsterSlot` ist optional, und ein fehlendes Feld bedeutet Generation 1. Ein
v5-Snapshot enthält zwangsläufig nur Basis-Monster, denn Gezüchtete waren vor
v6 gar nicht darstellbar — jede v5-Zeile ist damit semantisch bereits eine
v6-Zeile und wird nicht unlesbar, sondern vollständig. Die Migration hebt
deshalb nur `sim_version` und `contractVersion` an und fasst sonst nichts an.

Das Prädikat nennt die Altversion ausdrücklich (`sim_version IN ('0.0.4')`) und
lautet nicht „alles außer der aktuellen": ein `sim_version <> '0.0.5'` löschte
auch jede Zeile, die eine spätere Codebasis geschrieben hat. Die Unveränder-
lichkeitstrigger werden für den UPDATE abgelegt und danach wortgleich wieder
angelegt.

**Der Test zog eine Dublette in den gemeinsamen Code.** Der erste Wurf kopierte
sechs Zeilen aus dem v5-Test; das Redundancy-Gate meldete sie zu Recht, und
statt sie zu umgehen liegen sie jetzt in `src/db/migration-fixtures.mjs`, das
beide Tests importieren. Dabei fiel auf, dass `databaseWith` den
Migrations**inhalt** nehmen muss und nicht den Dateinamen — sonst baute der
Pfad den Inhalt als Dateinamen und scheiterte mit `ENAMETOOLONG`.

**Gates:** typecheck 0, 431 Tests in 63 Dateien, Shinon PASS.

## 2026-09-29 — Migration 003 zieht Contract v5 nach, und der Bestand wird einheitlich

**Der Sprung auf v5 macht v4-Zeilen unlesbar**, weil `RaidSnapshotSchema` und `ResultPayloadSchema` nur noch `contractVersion 5` mit `simVersion 0.0.4` akzeptieren. `migrations/003_contract_v5.sql` entfernt deshalb die `0.0.3`-Ära samt der Jobs, die sie als `snapshot_id` oder `target_snapshot_id` führen, und legt die Unveränderlichkeitstrigger wortgleich wieder an — ohne dieses kurzzeitige Ablegen ließe sich keine Zeile löschen. Warum löschen statt umschreiben: Die Ergebniszeilen einer v4-Nacht wurden unter einem Routenmodell gerechnet, das es nicht mehr gibt.

**Das Prädikat nennt die abgelöste Version ausdrücklich** und lautet nicht „alles außer der aktuellen". Der Fehler aus dem Audit vom 2026-09-28 — ein `sim_version <> '<aktuell>'` löschte auch spätere Zeilen — ist damit nicht wiederholbar; `raid-migration-v5.test.mjs` prüft drei Dinge getrennt: die v4-Ära fällt samt Jobs, eine spätere Version bleibt unangetastet, und die älteren Bestände überlässt 003 der Vorgängermigration. Ein vierter Test fährt die Kette 001 → 002 → 003 und verlangt einen einheitlichen Bestand.

**D1 bleibt unprovisioniert.** Die Migration beschreibt den Fall und ist gegen den In-Memory-SQLite geprüft, nicht gegen eine echte Datenbank. Der Server-Rand selbst ändert sich nicht: `raid-checkpoint.ts` parst weiter den privaten Stand, und der HTTP-Rand liefert weiterhin keinen Match.

## 2026-09-28 — Migration der alten Raid-Zeilen auf Contract v4

**Scope:** neu `migrations/002_contract_v4.sql` und `src/db/raid-migration-v4.test.mjs`. Kein Produktivcode, kein Tabellenschema geändert.

**Warum überhaupt eine Migration.** Ab v4 akzeptieren `RaidSnapshotSchema` und `ResultPayloadSchema` nur noch `contractVersion 4` mit `simVersion "0.0.3"`. `toSnapshot` parst `payload_json` mit dem strikten Schema und würde für jede v3-Zeile werfen; das `result_json` einer abgeschlossenen Nacht trägt `contractVersion 3`. Alte Zeilen sind damit unlesbar, und `raid_snapshots` ist per Trigger unveränderlich.

**Warum entfernt und nicht umgeschrieben.** Ein bloßes Hochsetzen der Versionsfelder reparierte nur die halbe Zeile: Im `result_json` steckt die Summary ohne `defendersTotal`, und der Kampflog liegt dort nicht — die Zahl der Verteidiger ist aus der Zeile nicht rekonstruierbar. Ein Bestand mit v4-Snapshots und v3-Ergebnissen wäre widersprüchlich, und ein erratener Roster wäre eine Lüge im Spielstand. Die Migration entfernt deshalb die v3-Snapshots samt der Jobs, die sie als `snapshot_id` oder `target_snapshot_id` führen, und legt die beiden Unveränderlichkeitstrigger danach wortgleich wieder an — ohne dieses kurzzeitige Ablegen ließe sich keine Zeile löschen. **Korrigierte Fassung:** Der erste Entwurf löschte mit `sim_version <> '0.0.3'` alles außer der damals aktuellen Version. Das trifft auch jede Zeile, die eine spätere Codebasis geschrieben hat — ein erneuter Lauf derselben Migration wäre stiller Datenverlust. Genannt werden jetzt ausdrücklich nur die abgelösten Versionen `0.0.1` und `0.0.2`.

**Der Test ist eine eigene Datei.** `raid-migration-v4.test.mjs` prüft genau eine Migration; `raid-migration.test.mjs` prüft das 001-Schema. Die Trennung ist auch eine Cap-Frage: zusammengelegt hätte die Datei den 120-Zeilen-Cap der Domäne gerissen. Der neue Test baut den v3-Bestand auf dem 001-Schema auf, fährt die 002-Migration und prüft drei Seiten — v3-Snapshots und der abhängige Job sind weg, die v4-Zeile und ihr Job bleiben, und eine Zeile einer späteren Version samt ihrem Job überlebt die Migration, weil sie nicht zu ihrem Auftrag gehört; danach weisen die Trigger ein `UPDATE` und ein `DELETE` wieder mit `immutable` ab. Die erwartete Simulationsversion kommt aus `sim_version` in `@floor/contracts`, damit die Zahl in der SQL-Datei nicht unbemerkt vom Code abdriftet.

**Was das nicht ist.** Kein Produktivlauf: Die D1-Bindung in `wrangler.jsonc` ist weiterhin auskommentiert, es gibt keinen Bestand, auf dem die Migration liefe. Sie beschreibt, was passiert, sobald einer da ist.

## 2026-09-27 — Worker-Rand und „Checkpoint" statt „Commit"

- **Umbenennung, weil der Begriff falsch war.** `raid-commit.ts` → `raid-checkpoint.ts`, `commitRaid` → `checkpointRaid`, `CommitRaidInput`/`CommitRaidResult` → `CheckpointRaidInput`/`CheckpointRaidResult`, `ATOMIC_COMMIT_FAILED` → `ATOMIC_CHECKPOINT_FAILED`, `D1RaidStore.commit` → `D1RaidStore.checkpoint`. Der Vorgang ist ein Git-Commit und auch kein Transaktions-Commit aus der Datenbanksprache, sondern ein geprüfter Fortschrittspunkt: ab hier gilt der hochgeladene Zustand als angekommen und ist per Trigger nicht mehr änderbar. Die älteren Einträge unten benutzen noch den alten Namen; sie beschreiben den damaligen Stand und wurden nicht angeschrieben.
- **`src/worker.ts` neu:** `export default { fetch }` mit drei Routen. `GET /api/health` meldet `syncAktiv`, `POST /api/sync/checkpoint` nimmt den Upload an, `GET /api/sync/job/:id` liest ihn zurück. Der Rand besitzt keine Statuslogik, er bildet nur `RaidStoreError` auf HTTP ab.
- **Der Zeitstempel kommt vom Server.** `now` ist keine Eingabe mehr, die der Client wählen darf: `expires_at` und `revision` hängen daran, und ein gemeldeter Zeitstempel wäre ein Freibrief, das eigene Job-Fenster zu verlängern.
- **Ohne D1 läuft das Spiel trotzdem.** Fehlt die Bindung, antworten die Sync-Routen 503 mit `SYNC_NICHT_VERBUNDEN`; die Asset-Auslieferung ist davon unabhängig. Ein fehlender Sync darf keinen spielbaren Stand blockieren.
- **`@floor/contracts` ist echte Workspace-Abhängigkeit** von `packages/server`. Vorher löste der Import nur über `tsconfig`-Pfade und Vitest-Alias auf; esbuild hätte ihn beim Bündeln des Workers nicht gefunden. Der Bündel-Schritt wäre im Deploy gescheitert statt im Test.
- **5 Randtests** in `src/worker.test.ts` gegen den SQLite-D1-Doppel: Health mit und ohne Binding, 503 ohne D1, Schreiben mit 201/200 und 409 beim zweiten offenen Job, 404 für fehlende Jobs, 400/405/404 für Eingabe, Methode und Route.

## 2026-09-26 — Idempotenz gemessen: Wiederholung ist ein No-Op

Keine Codeänderung. Eine Mess-Session gegen den SQLite-D1-Doppel mit Migration und Triggern hat das Verhalten von `commitRaid` bei wiederholtem `idempotencyKey` belegt. Die Beobachtungen sind in `docs/ROADMAP.md` als offene Prüfpunkte eingetragen.

- **Abgeschlossener Job plus Wiederholung:** Rückgabe mit identischem `result_json` und unveränderter Revision (gemessen `4 → 4`), `idempotent: true`. Kein zweiter Kampf, kein neues Ergebnis. Der Expire-Sweep sieht nur `accepted`, `queued` und `running`; zusätzlich würde der Trigger `raid_jobs_valid_status_transition` ein `completed → expired` per `RAISE(ABORT)` blockieren. Zwei unabhängige Mechanismen.
- **Abweichender Payload:** `IDEMPOTENCY_CONFLICT`. `INSERT OR IGNORE` lässt den alten Snapshot stehen, der Byte-Vergleich von `payloadJson` schlägt zu. Ein Key ist nicht mit anderem Inhalt überschreibbar.
- **Key durch anderen Angreifer belegt:** `IDEMPOTENCY_CONFLICT`, geschützt durch `job.attackerId !== input.attackerId` in `raid-commit.ts`. Squatting bleibt damit ein Denial-of-Service und ist kein Datenabfluss. Für Pre-Alpha mit client-generierten Keys vertretbar; mit serverseitig vergebenen UUIDs entfällt das Fenster.
- **Offene Lücke Test:** Der Abschluss-Fall ist in `raid-commit.test.ts` ungedeckt. Getestet sind Wiederholung im Status `accepted` und der Payload-Konflikt, nicht „abgeschlossen plus Wiederholung“ samt Revisionsstabilität.
- **Offene Lücke Sweep:** `EXPIRE_ATTACKER_OPEN_JOBS` hängt am Commit-Pfad. Ein Job, den niemand wiederholt, bleibt unbegrenzt `accepted`, bis ein fremder Commit mit derselben `attackerId` ihn einsammelt. Gehört zur Queue-Semantik in T3.
- **Hash trägt keine Identität:** Über `src` und `migrations` gibt es keine Verwendung von `hash` außerhalb der Tests. Der Kampf-Hash ist Replay-Selbstkonsistenz in `sim-core`; Identität und Idempotenz laufen über `idempotencyKey` und den Payload-Vergleich. FNV-1a-32 reicht für diese Aufgabe und wäre als Inhaltsadresse zu kurz.

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
