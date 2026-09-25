# packages/contracts/docs/STRINGMATRIX.md

## Versionen

| Schlüssel | Wert | Bedeutung |
|-----------|------|-----------|
| `CONTRACT_VERSION` | `2` |major des Wire-Formats |
| `sim_version` | `0.0.1` | exakt akzeptierte Simulationsversion |

Jeder Raid-Snapshot und jede dokumentierte Handshake-Nachricht führt verpflichtend `contractVersion: 2` und `simVersion: "0.0.1"`.

## Raid-Freeze

| Schlüssel | Exakter Typ |
|-----------|-------------|
| `snapshot.resources` | `{ gold: safe integer, materials: safe integer }` |
| `snapshot.monsterSlots` | exakt 5 × `{ monsterId: non-empty string \| null }` |
| `snapshot.activeTeam` | 1..5 × `{ heroId: non-empty string, temporaryFatigue: safe integer, temporaryInjury: safe integer }` |
| `snapshot.dungeon` | `DungeonGrid` mit 4096 Zellen und Koordinaten 0..63 |

Keine weiteren Werte, Formeln oder Balancing-Regeln sind Teil des v2-Snapshotvertrags.

## Handshake

| Schlüssel | Pflichtfelder und Typen |
|-----------|-------------------------|
| `proto/upload` | vollständiger `RaidSnapshot` plus `tactics: string[][0..3]` mit genau einer Liste je aktivem Helden |
| `proto/match` | `seed: Integer 0..MAX_SAFE_INTEGER`, `floor: Integer > 0`, `snapshot: RaidSnapshot` |
| `proto/results` | `token: non-empty string`, `floor: Integer > 0`, `hash: non-empty string`, `summary: JSON object` |

## Fehler

| Fehlerklasse | Code |
|--------------|------|
| Ziel gesperrt | `blocked` |
| Replay-Hash passt nicht | `invalid-hash` |
| Defender geschützt | `protected` |

Unbekannte Codes, fehlende Pflichtfelder und zusätzliche Felder werden durch `.strict()` abgewiesen. Contract v1 wird von v2 nicht akzeptiert.
