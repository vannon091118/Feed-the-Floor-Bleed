-- Contract v8 nachziehen.
--
-- Ab v8 trägt jeder Verteidiger ein `behavior` im Log: das Verhaltensprofil,
-- das aus dem Trait seiner Art entsteht (`sim-core/src/genome/behavior.ts`).
-- Das Feld ist Pflicht, weil `replayCombat` und `verifyCombatLog`
-- ausschließlich den Log lesen — wer das nächste Ziel wählt, entscheidet damit
-- über Ereignisfolge und Hash, und eine Wahl, die nur im Speicher läge, wäre
-- im Replay nicht reproduzierbar.
--
-- **Warum hier angehoben und nicht gelöscht — dieselbe Haltung wie in 005:**
-- Ein v7-Snapshot ist die eingefrorene Eingabe (Ressourcen, Monster-Slots mit
-- Generation, Heldenteam, Dungeon); ihre Form ändert sich in v8 nicht. Der
-- Kampf wird beim Lesen neu gerechnet, und die v7-Zeile bleibt damit semantisch
-- eine v8-Zeile: dieselbe Epoche, ein anderes Kampfmodell.
--
-- **Der Unterschied zu v7, der hier ausgesprochen gehört:** Mit `behavior`
-- am Spec und der profilabhängigen Zielentscheidung verschiebt sich jeder
-- gespeicherte Hash ein weiteres Mal — ein neues Pflichtfeld im Hash und eine
-- andere Event-Folge, weil `tank`, `hunter` und `control` ein anderes Ziel
-- wählen als die alte „nächstes Ziel"-Regel. Auch hier wird nichts
-- nachgerechnet: das serverseitige Replay-Gate ist T3.2 und nicht gebaut
-- (siehe `docs/ROADMAP.md`); die Epoche markiert das Versionsfeld.
--
-- Das Prädikat nennt die abgelöste Version ausdrücklich und lautet nicht
-- „alles außer der aktuellen": ein `sim_version <> '0.0.7'` löschte auch jede
-- Zeile, die eine spätere Codebasis geschrieben hat. Bei erneuter Ausführung
-- wäre das stiller Datenverlust.
--
-- Diese Datei ist eine Momentaufnahme des Sprungs 7→8 und wird bei einem
-- späteren Versionssprung nicht angepasst.

PRAGMA foreign_keys = ON;

DROP TRIGGER raid_snapshots_immutable_update;
DROP TRIGGER raid_snapshots_immutable_delete;

-- Angehoben werden allein die Snapshots: `raid_jobs` trägt keine
-- Versionsfelder und verweist mit `snapshot_id` und `target_snapshot_id` auf
-- dieselben Zeilen, die ihren Platz behalten. Die Unveränderlichkeitstrigger
-- liegen für die Dauer des UPDATEs ab und danach wieder an — ohne dieses
-- kurzzeitige Ablegen liese sich keine Zeile anfassen.
UPDATE raid_snapshots
SET sim_version = '0.0.7',
    payload_json = json_set(payload_json, '$.contractVersion', 8)
WHERE sim_version IN ('0.0.6');

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
