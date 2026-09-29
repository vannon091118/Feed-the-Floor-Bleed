# packages/contracts/docs/STRINGMATRIX.md

## Versionen

| Schlüssel | Wert | Bedeutung |
|-----------|------|-----------|
| `CONTRACT_VERSION` | `9` |major des Wire-Formats |
| `sim_version` | `0.0.8` | exakt akzeptierte Simulationsversion |

Jeder Raid-Snapshot, jedes Ergebnis, jeder Log und jeder Auftrag führt verpflichtend `contractVersion: 9` und `simVersion: "0.0.8"`.

## Raid-Freeze

| Schlüssel | Exakter Typ |
|-----------|-------------|
| `snapshot.resources` | `{ gold: safe integer, materials: safe integer }` |
| `snapshot.monsterSlots` | exakt 5 × `{ monsterId: non-empty string \| null, generation?: Integer ≥ 1 }` |
| `snapshot.activeTeam` | 1..5 × `{ heroId: non-empty string, temporaryFatigue: safe integer, temporaryInjury: safe integer }` |
| `snapshot.escrow` | *optional* `{ gold: safe integer, materials: safe integer }`; fehlend heißt „noch nichts gesichert“ |
| `snapshot.dungeon` | `DungeonGrid` mit 4096 Zellen und Koordinaten 0..63 |

Keine weiteren Werte, Formeln oder Balancing-Regeln sind Teil des v9-Snapshotvertrags. Dieser Stand ist **privat**: Er geht an den Server, nicht an den Angreifer.

## Ergebnislog und Auftrag

| Schlüssel | Exakter Typ |
|-----------|-------------|
| `log.stage` | `'heroes-win' \| 'monsters-win' \| 'timeout' \| 'extracted'`; `extracted` setzt der Auftrag nach dem Sichern, die Engine liefert ihn nicht |
| `log.hash` | `^[0-9a-f]{8}$` |
| `log.events[].type` | `'move' \| 'attack' \| 'death' \| 'ambush' \| 'ability' \| 'reveal' \| 'end'`; ein `ambush` trägt in `amount` die durchdrungene Rüstung, `ability` die Wirkung, `reveal` in `toIndex` die aufgedeckte Zellnummer (bei `move` ist `toIndex` der Trail-Schritt) |
| `log.events[].stage` | eine der obigen vier Stufen oder `'running'` |
| `log.trail[]` | `{ x: 0..63, y: 0..63, cell: 0..4, zoneId: ≥ -1 }`, jeder Schritt der Route in Reihenfolge; `-1` steht für „keine Zone“ |
| `log.units[]` | `{ id, side, role, behavior, class, maxHp, attack, defense, initiative, moveCooldown, attackCooldown, routeIndex, ambushZoneId }`; `behavior` ist das Verhaltensprofil (`'none' \| 'tank' \| 'hunter' \| 'control'`), `class` die Heldenklasse (`HERO_CLASSES`, `'none'` bei Monstern und klassenlosen Helden), `routeIndex` zeigt auf eine Trail-Zelle, `ambushZoneId` ist die Zone der Platzierungsgruppe (`-1` sonst) |

## Angreifer-Sicht

| Schlüssel | Exakter Typ |
|-----------|-------------|
| `view.dungeon` | `DungeonGrid` wie im Freeze, aber ohne Platzierungsmarkierungen: Zellnummer 2 wird zu 0 |
| `view.contractVersion` / `view.simVersion` | wie im Freeze |
| `view.revealed` | `number[0..4096]`, jede Nummer `0..4095`; die Zellen, die der Späher beantwortet hat. Leer ist der heutige Stand |
| `view.monsterSlots` / `view.resources` / `view.activeTeam` | **existieren nicht**; das Schema ist strikt und lehnt sie ab |

Die Sicht entsteht ausschließlich über `toPublicView`. Später kommen hier die Bonus-Schätze dazu, die der Angreifer markieren darf.

## Ergebnis und Auftrag

| Schlüssel | Exakter Typ |
|-----------|-------------|
| `result.summary` | `{ stage, ticks, hash, events, attacks, damage, defendersTotal, heroesAlive, monstersAlive, bossAlive }`; `monstersAlive` zählt ohne den Boss, `bossAlive` ist sein eigenes Feld, `defendersTotal` ist der eingefrorene Verteidiger-Roster inklusive Boss |
| `job.status` | `accepted \| queued \| running \| completed \| failed \| expired` |
| `error.code` | `blocked \| invalid-hash \| invalid-request \| protected \| timeout` |
| `error.detail` | optionaler String max. 200 Zeichen, stabiler Feldpfad |

`expired` verlangt zwingend `code: 'timeout'`; `failed` verlangt einen der vier
übrigen Codes. Ein `completed`-Auftrag ohne `result` und ein `failed`-Auftrag
mit `result` sind nicht darstellbar.

## Handshake

| Schlüssel | Pflichtfelder und Typen |
|-----------|-------------------------|
| `proto/upload` | vollständiger `RaidSnapshot` plus `tactics: TacticRule[][0..3]` mit genau einer Liste je aktivem Helden; eine Regel ist `{ ability: AbilityId, when?: TacticWhen }`, `when` fehlend heißt `immediate` |
| `proto/match` | `seed: Integer 0..MAX_SAFE_INTEGER`, `floor: Integer > 0`, `snapshot: RaidPublicView` (nicht der private Stand) |
| `proto/results` | `token: non-empty string`, `floor: Integer > 0`, `hash: non-empty string`, `summary: JSON object` |

## Fehler

| Fehlerklasse | Code |
|--------------|------|
| Ziel gesperrt | `blocked` |
| Replay-Hash passt nicht | `invalid-hash` |
| Ungültige Anfrage | `invalid-request` |
| Defender geschützt | `protected` |
| Frist abgelaufen | `timeout` |

Unbekannte Codes, fehlende Pflichtfelder und zusätzliche Felder werden durch `.strict()` abgewiesen. Die Contract-Stände v1 bis v8 werden von v9 nicht akzeptiert.

## Klassen, Fähigkeiten und Taktikregeln

| Schlüssel | Erlaubte Werte |
|-----------|----------------|
| `HERO_CLASSES` | `none`, `vanguard`, `breaker`, `scout`, `medic`, `controller`, `guardian` |
| `ABILITY_IDS` | `shield`, `shatter`, `reveal`, `mend`, `frost`, `hold` |
| `TACTIC_WHEN_KINDS` | `immediate`, `allyBelow`, `selfBelow`, `bossNear` |
| `when.thresholdPermille` | Integer `0..1000`; **Pflicht** bei `allyBelow` und `selfBelow`, **verboten** bei `immediate` und `bossNear` |

Diese Datei führt ausschließlich die Namen. Jede Zahl dahinter — Klassenboni, Fähigkeitswirkungen, Schwellen — ist `[K]` und steht an ihrer Quelle im `sim-core`.
