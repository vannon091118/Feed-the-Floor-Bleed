# packages/contracts/docs/REPOINDEX.md

| Pfad | Job |
|------|-----|
| `packages/contracts/src/version.ts` | Contract- und Simulationsversion (`CONTRACT_VERSION`, `sim_version`) |
| `packages/contracts/src/abilities.ts` | Einziges Helden-Vokabular des Wire-Formats: `HERO_CLASSES`, `ABILITY_IDS`, `TACTIC_WHEN_KINDS`, `TacticWhenSchema` und `TacticRuleSchema`; führt die Namen, keine Zahlen |
| `packages/contracts/src/cell.ts` | Zelltyp-Schema `CellTypeSchema` (0..4) plus benannte Zellnummern `EMPTY`/`WALL`/`PLACEMENT`/`SPAWN`/`BOSS_CELL`, geteilt von Grid und Trail |
| `packages/contracts/src/grid.ts` | Grid- und Pathfinding-Schemas |
| `packages/contracts/src/raid-snapshot.ts` | Kanonischer unveränderlicher Raid-Freeze, inklusive optionalem `escrow`-Zwischenstand |
| `packages/contracts/src/protocol.ts` | Upload-, Match-, Result-, Log- und Fehler-Schemas; `MatchResponse.snapshot` ist die öffentliche Sicht |
| `packages/contracts/src/raid-public.ts` | Öffentliche Angreifer-Sicht `RaidPublicViewSchema` (mit `revealed`) und die Maske `toPublicView` |
| `packages/contracts/src/trail.ts` | Trail-Schema: `CombatTrailEntry` mit x/y/cell/zoneId |
| `packages/contracts/src/combat-vocabulary.ts` | Feste Wörter des Kampfs: `COMBAT_STAGES` (inkl. `extracted`), `COMBAT_EVENT_TYPES` (inkl. `ability`/`reveal`), Seiten, Rollen, `MONSTER_BEHAVIORS` und ihre Schemas; ausgelagert, weil `combat-log.ts` den 120-Zeilen-Cap riss |
| `packages/contracts/src/combat-log.ts` | Strikte Wire-Form von Config, Einheiten (inkl. Verhaltensprofil und Heldenklasse), Events und Log (inkl. Trail und Invarianten); liest die Wörter aus `combat-vocabulary.ts` |
| `packages/contracts/src/combat-summary.ts` | Ergebnis-Kurzfassung `CombatSummarySchema` für Listen, Logs und Client-Anzeige |
| `packages/contracts/src/job.ts` | Auftragsstatus, Übergangsautomat, Job als Diskriminated Union |
| `packages/contracts/src/index.ts` | Öffentliche Contract-Exports |
| `packages/contracts/test/abilities.test.ts` | Taktikregel-Naht: fehlende Bedingung, unbekannte Fähigkeit, Schwelle genau dort, wo sie gelesen wird |
| `packages/contracts/test/raid-snapshot.test.ts` | Vollständige Freeze-Daten, optionaler Escrow und Versionsgrenzen |
| `packages/contracts/test/raid-public.test.ts` | Angreifer-Sicht: keine Roster-Daten, maskierte Platzierungszellen, keine Match-Antwort mit vollem Stand |
| `packages/contracts/test/contracts.test.ts` | Snapshot-, Handshake- und Kompatibilitätstests |
| `packages/contracts/test/combat-log.test.ts` | Log-Invarianten, Summary-Trennung, JSON-Roundtrip |
| `packages/contracts/test/job.test.ts` | Zustandsautomat, Fehler/Timeout-Trennung, Roundtrip |
| `packages/contracts/test/raid-fixtures.ts` | Gültige v9-Test-Snapshots, Logs und Jobs samt Angreifer-Sicht |
| `packages/contracts/docs/*` | Pflicht-Doku dieser Domäne |
