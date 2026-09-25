# packages/contracts/docs/CHANGELOG.md

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
