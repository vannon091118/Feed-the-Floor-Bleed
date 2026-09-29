-- Contract v4 nachziehen.
--
-- Ab v4 akzeptieren `RaidSnapshotSchema` und `ResultPayloadSchema` nur noch
-- `contractVersion 4` mit `simVersion "0.0.3"`. Jede abgelegte v3-Zeile ist
-- damit unlesbar: `toSnapshot` parst `payload_json` mit dem strikten Schema
-- und wirft, `raid_jobs`-Ergebnisse tragen `contractVersion 3` in
-- `result_json`.
--
-- Warum entfernt und nicht umgeschrieben: Der Snapshot ist per Trigger
-- unveränderlich, und ein bloßes Hochsetzen der Versionsfelder reparierte nur
-- die halbe Zeile. Im `result_json` einer abgeschlossenen Nacht steckt die
-- Summary ohne `defendersTotal`, und der vollständige Kampflog liegt dort
-- nicht — die Zahl der Verteidiger ist aus der Zeile nicht rekonstruierbar.
-- Ein Bestand, in dem Snapshots auf v4 stehen und Ergebnisse v3 bleiben, wäre
-- widersprüchlich, und ein erratener Roster wäre eine Lüge im Spielstand.
--
-- Die Unveränderlichkeitstrigger werden für den Löschvorgang abgelegt und
-- danach wortgleich wieder angelegt; ohne sie lässt sich keine Zeile
-- entfernen.
--
-- Diese Datei ist eine Momentaufnahme des Sprungs 3→4 und wird bei einem
-- späteren Versionssprung nicht angepasst: genannt werden genau die
-- Simulationsversionen, die v4 abgelöst hat — '0.0.2' schrieb die
-- v3-Codebasis, '0.0.1' die v2-Codebasis davor.
--
-- Das Prädikat nennt die Altsversionen **ausdrücklich** und lautet nicht
-- „alles außer der aktuellen": Ein `sim_version <> '0.0.3'` löschte auch jede
-- Zeile, die eine spätere Codebasis geschrieben hat. Wird eine bereits
-- gelaufene Migration erneut ausgeführt, wäre das stiller Datenverlust.

PRAGMA foreign_keys = ON;

DROP TRIGGER raid_snapshots_immutable_update;
DROP TRIGGER raid_snapshots_immutable_delete;

-- Erst die abhängigen Jobs, dann die Snapshots: `raid_jobs` verweist mit
-- `snapshot_id` und `target_snapshot_id` auf `raid_snapshots`.
DELETE FROM raid_jobs
WHERE snapshot_id IN (
    SELECT id FROM raid_snapshots WHERE sim_version IN ('0.0.1', '0.0.2')
  )
  OR target_snapshot_id IN (
    SELECT id FROM raid_snapshots WHERE sim_version IN ('0.0.1', '0.0.2')
  );

DELETE FROM raid_snapshots WHERE sim_version IN ('0.0.1', '0.0.2');

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
