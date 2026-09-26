# packages/contracts/docs/REPOINDEX.md

| Pfad | Job |
|------|-----|
| `packages/contracts/src/version.ts` | Contract-v3- und Simulationsversion |
| `packages/contracts/src/cell.ts` | Zelltyp-Schema `CellTypeSchema` (0..4), geteilt von Grid und Trail |
| `packages/contracts/src/grid.ts` | Grid- und Pathfinding-Schemas |
| `packages/contracts/src/raid-snapshot.ts` | Kanonischer unveränderlicher Raid-Freeze |
| `packages/contracts/src/protocol.ts` | Upload-, Match-, Result-, Log- und Fehler-Schemas |
| `packages/contracts/src/trail.ts` | Trail-Schema: `CombatTrailEntry` mit x/y/cell |
| `packages/contracts/src/combat-log.ts` | Strikte Wire-Form von Config, Einheiten, Events, Log (inkl. Trail) und Summary |
| `packages/contracts/src/job.ts` | Auftragsstatus, Übergangsautomat, Job als Diskriminated Union |
| `packages/contracts/src/index.ts` | Öffentliche Contract-Exports |
| `packages/contracts/test/raid-snapshot.test.ts` | Vollständige Freeze-Daten und v3-Grenzen |
| `packages/contracts/test/contracts.test.ts` | Snapshot-, Handshake- und Kompatibilitätstests |
| `packages/contracts/test/combat-log.test.ts` | Log-Invarianten, Summary-Trennung, JSON-Roundtrip |
| `packages/contracts/test/job.test.ts` | Zustandsautomat, Fehler/Timeout-Trennung, Roundtrip |
| `packages/contracts/test/raid-fixtures.ts` | Gültige v3-Test-Snapshots, Logs und Jobs |
| `packages/contracts/docs/*` | Pflicht-Doku dieser Domäne |
