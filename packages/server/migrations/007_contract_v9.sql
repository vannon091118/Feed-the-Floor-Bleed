-- Contract v9 nachziehen.
--
-- Ab v9 trägt jede Einheit im Log eine `class` (`packages/contracts/src/abilities.ts`),
-- der Snapshot führt einen optionalen `escrow`, die Ereignisarten kennen
-- `ability` und `reveal`, die Stufen `extracted`, und die Taktiken im Upload
-- sind Regeln statt Opaque-Strings. **Was diese Datei davon anfasst, ist
-- trotzdem wenig** — und das gehört ausgesprochen, statt es zu behaupten:
--
-- Die eingefrorene Eingabe ist `resources, monsterSlots, activeTeam, dungeon`.
-- Sie ändert sich in v9 nicht. `escrow` kommt als **optionales** Feld dazu;
-- eine v8-Zeile ohne es liest sich als „noch nichts gesichert“ und nicht als
-- „unbekannt“, genau wie ein Snapshot ohne `generation` als Generation 1 gilt.
-- `class` am Log, `revealed` in der Angreifer-Sicht und `extracted` in den
-- Stufen sind abgeleitete Formen: sie entstehen beim Rechnen und beim Lesen,
-- nicht im gespeicherten Stand. Die Taktiken stehen im Upload und **nicht** im
-- Snapshot — der Checkpoint streicht sie beim Einfrieren (siehe
-- `raid-checkpoint.test.ts`), also gibt es hier keine gespeicherten
-- Opaque-Strings, die auf Regeln umgeschrieben werden müssten.
--
-- **Warum hier angehoben und nicht gelöscht — dieselbe Haltung wie in 005 und
-- 006:** Ein v8-Snapshot ist die eingefrorene Eingabe; ihre Form bleibt in v9
-- lesbar. Der Kampf wird beim Lesen neu gerechnet, und die v8-Zeile bleibt
-- damit semantisch eine v9-Zeile: dieselbe Epoche, ein anderes Kampfmodell.
--
-- **Der Unterschied, der hier ausgesprochen gehört:** Mit `class` im `specHash`
-- verschiebt sich jeder gespeicherte Hash ein weiteres Mal. Die Zahlen der
-- Läufe selbst bleiben gleich — die Engine schreibt bis zum Klassen-Slice
-- ausschließlich `none` —, aber der Hash ist der Vertrag zwischen gespeichertem
-- Replay und heutiger Engine, und ein neues Pflichtfeld im Spec gehört in ihn.
-- Nichts wird nachgerechnet: das serverseitige Replay-Gate ist T3.2 und nicht
-- gebaut (siehe `docs/ROADMAP.md`); die Epoche markiert das Versionsfeld.
--
-- Das Prädikat nennt die abgelöste Version ausdrücklich und lautet nicht
-- „alles außer der aktuellen": ein `sim_version <> '0.0.8'` löschte auch jede
-- Zeile, die eine spätere Codebasis geschrieben hat. Bei erneuter Ausführung
-- wäre das stiller Datenverlust.
--
-- `raid_jobs` wird nicht angefasst: die Tabelle trägt keine Versionsfelder und
-- verweist mit `snapshot_id` und `target_snapshot_id` auf dieselben Zeilen, die
-- ihren Platz behalten. Die Unveränderlichkeitstrigger liegen für die Dauer des
-- UPDATEs ab und danach wieder an — ohne dieses kurzzeitige Ablegen ließe sich
-- keine Zeile anfassen.
--
-- Diese Datei ist eine Momentaufnahme des Sprungs 8→9 und wird bei einem
-- späteren Versionssprung nicht angepasst.

PRAGMA foreign_keys = ON;

DROP TRIGGER raid_snapshots_immutable_update;
DROP TRIGGER raid_snapshots_immutable_delete;

UPDATE raid_snapshots
SET sim_version = '0.0.8',
    payload_json = json_set(payload_json, '$.contractVersion', 9)
WHERE sim_version IN ('0.0.7');

CREATE TRIGGER raid_snapshots_immutable_update
BEFORE UPDATE ON raid_snapshots
BEGIN
  SELECT RAISE(ABORT, 'raid snapshots are immutable');
END;

CREATE TRIGGER raid_snapshots_immutable_delete
BEFORE DELETE ON raid_snapshots
BEGIN
  SELECT RAISE(ABORT, 'raid snapshots are immutable');
END;
