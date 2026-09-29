-- Contract v7 nachziehen.
--
-- Ab v7 trägt jeder Verteidiger eine `ambushZoneId`, jeder Trail-Schritt eine
-- `zoneId`, und die Bewegung läuft wieder entlang der Route. Der Grund für die
-- letzte Zeile ist die Replay-Prüfung: `replayCombat` und `verifyCombatLog`
-- lesen ausschließlich den Log. Eine zweite Ortsquelle neben dem Trail hätte
-- den gespeicherten Lauf unverifizierbar gemacht.
--
-- **Warum hier geschrieben und nicht gelöscht — anders als bei 003:** Ein
-- v6-Snapshot ist die *eingefrorene Eingabe* (Ressourcen, Monster-Slots mit
-- Generation, Heldenteam, Dungeon). Ihre Form ändert sich in v7 nicht; der
-- Kampf wird beim Lesen beziehungsweise beim Replay neu gerechnet. Jede
-- v6-Zeile ist damit semantisch bereits eine v7-Zeile, und ein Löschvorgang
-- vernichtete Daten, die die neue Codebasis vollständig liest.
--
-- **Der Unterschied zu v6, der hier ausgesprochen gehört:** Das Kampfmodell
-- ändert sich in v7 sehr wohl — die Bewegung, die Zonen und damit jeder Hash.
-- Ein `result_json` aus der v6-Ära trägt deshalb einen Hash, den die neue
-- Engine nicht mehr reproduziert. Er wird nirgends nachgerechnet: Das
-- serverseitige Replay-Gate ist T3.2 und nicht gebaut (siehe `docs/ROADMAP.md`),
-- der Hash ist bis dahin Replay-Selbstkonsistenz in `sim-core`. Der Datensatz
-- bleibt damit lesbar und in sich stimmig; die Epoche markiert das
-- Versionsfeld, nicht die Löschung.
--
-- Das Prädikat nennt die abgelöste Version **ausdrücklich** und lautet nicht
-- „alles außer der aktuellen“: Ein `sim_version <> '0.0.6'` löschte auch jede
-- Zeile, die eine spätere Codebasis geschrieben hat. Wird diese Migration
-- erneut ausgeführt, ist das stiller Datenverlust.
--
-- Diese Datei ist eine Momentaufnahme des Sprungs 6→7 und wird bei einem
-- späteren Versionssprung nicht angepasst.

PRAGMA foreign_keys = ON;

DROP TRIGGER raid_snapshots_immutable_update;
DROP TRIGGER raid_snapshots_immutable_delete;

-- Erst die abhängigen Jobs, dann die Snapshots: `raid_jobs` verweist mit
-- `snapshot_id` und `target_snapshot_id` auf `raid_snapshots`.
UPDATE raid_snapshots
SET sim_version = '0.0.6',
    payload_json = json_set(payload_json, '$.contractVersion', 7)
WHERE sim_version IN ('0.0.5');

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
