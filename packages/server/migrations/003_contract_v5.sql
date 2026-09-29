-- Contract v5 nachziehen.
--
-- Ab v5 akzeptieren `RaidSnapshotSchema` und `ResultPayloadSchema` nur noch
-- `contractVersion 5` mit `simVersion "0.0.4"`. Der Sprung hat zwei Gründe:
-- `MatchResponseSchema.snapshot` trägt jetzt die öffentliche Angreifer-Sicht
-- (`RaidPublicViewSchema`) statt des vollen Stands, und `PathResultSchema`
-- kennt das Umwegbudget der Falle nicht mehr — eine Platzierungsmarkierung
-- kostet wie Boden (`simVersion` 0.0.4).
--
-- Jede abgelegte v4-Zeile ist damit unlesbar: `toSnapshot` parst `payload_json`
-- mit dem strikten Schema und wirft am Versionsfeld, `raid_jobs`-Ergebnisse
-- tragen `contractVersion 4` in `result_json`.
--
-- Warum entfernt und nicht umgeschrieben: Der Snapshot ist per Trigger
-- unveränderlich, und ein bloßes Hochsetzen der Versionsfelder reparierte nur
-- die halbe Zeile. Die Ergebniszeilen einer v4-Nacht wurden unter einem
-- Routenmodell gerechnet, das es nicht mehr gibt; ein umgeschriebener Stand
-- behauptete eine Herkunft, die er nicht hat.
--
-- Die Unveränderlichkeitstrigger werden für den Löschvorgang abgelegt und
-- danach wortgleich wieder angelegt; ohne sie lässt sich keine Zeile entfernen.
--
-- Diese Datei ist eine Momentaufnahme des Sprungs 4→5 und wird bei einem
-- späteren Versionssprung nicht angepasst: genannt wird genau die
-- Simulationsversion, die v5 ablöst — '0.0.3' schrieb die v4-Codebasis. Die
-- älteren Bestände ('0.0.1', '0.0.2') hat `002_contract_v4.sql` entfernt; sie
-- stehen hier nicht noch einmal, weil die Migrationen in Reihenfolge laufen.
--
-- Das Prädikat nennt die Altversion **ausdrücklich** und lautet nicht „alles
-- außer der aktuellen": Ein `sim_version <> '0.0.4'` löschte auch jede Zeile,
-- die eine spätere Codebasis geschrieben hat. Wird eine bereits gelaufene
-- Migration erneut ausgeführt, wäre das stiller Datenverlust.

PRAGMA foreign_keys = ON;

DROP TRIGGER raid_snapshots_immutable_update;
DROP TRIGGER raid_snapshots_immutable_delete;

-- Erst die abhängigen Jobs, dann die Snapshots: `raid_jobs` verweist mit
-- `snapshot_id` und `target_snapshot_id` auf `raid_snapshots`.
DELETE FROM raid_jobs
WHERE snapshot_id IN (
    SELECT id FROM raid_snapshots WHERE sim_version IN ('0.0.3')
  )
  OR target_snapshot_id IN (
    SELECT id FROM raid_snapshots WHERE sim_version IN ('0.0.3')
  );

DELETE FROM raid_snapshots WHERE sim_version IN ('0.0.3');

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
