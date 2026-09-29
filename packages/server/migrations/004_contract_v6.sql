-- Contract v6 nachziehen.
--
-- Ab v6 trägt `monsterSlots[i].generation` die Zuchtstufe des Verteidigers.
-- Die Goldformel (`docs/GOLDFORMEL.md`) rechnet die Beute je gefallenem Gegner
-- aus **Stärke und Generation**. Die Stärke ließ sich über `monsterId` aus der
-- Registry auflösen; die Generation stand nirgends. Deshalb kommt sie hierher
-- und nicht ins Ergebnis: sie gehört zum eingefrorenen Verteidiger, und ein
-- Ergebnis, das sie nachzählte, müsste sie erst dorthin kopieren.
--
-- Warum die Generation **nicht** in `monsterId` gewandert ist: die Basisart
-- geht als Salz in den Zucht-Seed ein (`genome/mutation.ts`, `deriveSeed`).
-- Läge die Generation im String, verschöbe jede Zucht den Seed und damit den
-- Replay-Hash eines eingefrorenen Runs. Als eigenes Feld bleibt der Seed
-- unberührt — der Zuchtverlauf eines alten Stands ist exakt derselbe.
--
-- **Warum hier geschrieben und nicht gelöscht — anders als bei 003:** Das neue
-- Feld ist optional, und ein fehlendes `generation` bedeutet Generation 1. Ein
-- v5-Snapshot enthält zwangsläufig nur Basis-Monster, denn Gezüchtete waren vor
-- v6 gar nicht darstellbar. Jede v5-Zeile ist damit semantisch bereits eine
-- v6-Zeile. Ein Löschvorgang würde Daten vernichten, die die neue Codebasis
-- korrekt liest — der Snapshot ist dann nicht unlesbar, sondern vollständig.
-- Deshalb wird das Versionsfeld angehoben und sonst nichts angefasst.
--
-- `sim_version` steigt mit, weil das Schreiben eines Checkpoints jetzt eine
-- Zuchtstufe mitträgt. Die *Kampfrechnung* ändert sich dabei nicht: dieselben
-- Einheiten mit demselben Seed ergeben denselben Log und denselben Hash.
--
-- Wie bei 003 nennt das Prädikt die Altversion **ausdrücklich** und lautet
-- nicht „alles außer der aktuellen": Ein `sim_version <> '0.0.5'` löschte auch
-- jede Zeile, die eine spätere Codebasis geschrieben hat. Wird diese Migration
-- erneut ausgeführt, ist das stiller Datenverlust.
--
-- Diese Datei ist eine Momentaufnahme des Sprungs 5→6 und wird bei einem
-- späteren Versionssprung nicht angepasst.

PRAGMA foreign_keys = ON;

DROP TRIGGER raid_snapshots_immutable_update;
DROP TRIGGER raid_snapshots_immutable_delete;

-- Erst die abhängigen Jobs, dann die Snapshots: `raid_jobs` verweist mit
-- `snapshot_id` und `target_snapshot_id` auf `raid_snapshots`.
--
-- Ein Job aus der v5-Ära bleibt erhalten und wird mitgezogen: sein Ergebnis
-- wurde unter demselben Kampfmodell gerechnet, und der Verweis bleibt gültig.
-- Verworfen wird nur, was die neue Codebasis nicht mehr lesen kann — und das
-- ist bei diesem Sprung nichts, weil das neue Feld optional ist.
UPDATE raid_snapshots
SET sim_version = '0.0.5',
    payload_json = json_set(payload_json, '$.contractVersion', 6)
WHERE sim_version IN ('0.0.4');

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
