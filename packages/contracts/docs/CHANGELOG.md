# packages/contracts/docs/CHANGELOG.md

## 2026-09-25 — T1.3 Ergebnislog, Job-Union und Fehlercode-Vokabular

- `packages/contracts/src/combat-log.ts` ergänzt: strikte Schemas für `CombatConfig`, `CombatUnitSpec`, `CombatEvent`, `CombatLog` und `CombatSummary`. Invarianten: eindeutige Einheiten-IDs, schließendes `end`-Ereignis in der Ergebnisstufe, keine unbekannten Einheiten, kein Tick hinter dem Log-Ende.
- `CombatSummary` ersetzt das freie `record(json)` in `ResultPayloadSchema`. Ergebnislisten sind damit typisiert statt beliebig.
- `RaidLogPayloadSchema` trägt den vollständigen Log als eigenes Artefakt mit Envelope, Token, Etage und Hash; `ResultPayloadSchema` bleibt klein.
- `packages/contracts/src/job.ts` ergänzt: sechs Auftragsstatus, gerichteter Übergangsautomat und `RaidJobSchema` als Diskriminated Union. `completed` muss ein Ergebnis tragen, `failed`/`expired` einen Fehler, offene Zustände beides nicht.
- `ErrorCodeSchema` von drei auf fünf Codes erweitert: `invalid-request` (Schema-/Protokollfehler) und `timeout` (abgelaufene Auftragsfrist). `ErrorPayloadSchema` bekommt ein optionales `detail` mit stabilem Feldpfad.
- Kampf-Timeout und Auftrags-Timeout sind jetzt strukturell getrennt: Der Kampf-Timeout ist `summary.stage === 'timeout'` in einem erfolgreichen Ergebnis, der Auftrags-Timeout ist `status: 'expired'` mit `code: 'timeout'`.
- Tests decken Log-Invarianten, JSON-Roundtrip, die sechs Zustände, die Übergänge und die Fehler/Timeout-Trennung ab.
- `CONTRACT_VERSION` bleibt 2: keine bestehende Payload verliert eine Pflichtform, die akzeptierte Menge wird nur enger.

## 2026-09-25 — Vollständiger Raid-Freeze / Contract v2

- `RaidSnapshotSchema` für Ressourcen, exakt fünf Monster-Slots, aktive Helden mit temporärer Müdigkeit und Verletzung sowie Dungeon ergänzt.
- Upload und Match verlangen nun den vollständigen versionierten Snapshot; Taktiken bleiben außerhalb des persistierten Freeze.
- Contract auf v2 erhöht; v1 und inkompatible Folgestände werden abgewiesen.
- Contract-Fixtures und Tests für Vollständigkeit, unbekannte Felder, Slot-/Teamgrenzen und Kompatibilität ergänzt.
- Keine Balancing-Formeln, zusätzlichen Gameplay-Werte oder Runtime-Flows erfunden.

## 2026-09-25 — Contract-Grundlage

- Versionierte, strikte Zod-Schemas für das vorhandene 64×64-Grid und Pathfinding-Ergebnisse ergänzt.
- Dokumentierte Upload-, Match-, Result- und die drei Fehlerklassen mit Pflichtfeldern und exakten Grenzen typisiert.
- Contract-Tests für gültige/ungültige Payloads, Versionskonflikte, unbekannte Felder und Grid-/Pathfinding-Invarianten ergänzt.
- Keine D1-, Queue-, Client-, Server- oder End-to-End-Flows implementiert.

## 2026-09-25 — Init

- Domäne angelegt: `packages/contracts/src` (Zod-Schemas, sim_version kommt).
- Hygiene-Skelett erfüllt (5 Dokus aktiv, historisch/ vorhanden).
