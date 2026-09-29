# packages/contracts/docs/STRINGMATRIX.md

## Versionen

| Schlüssel | Wert | Bedeutung |
|-----------|------|-----------|
| `CONTRACT_VERSION` | `7` |major des Wire-Formats |
| `sim_version` | `0.0.6` | exakt akzeptierte Simulationsversion |

Jeder Raid-Snapshot, jedes Ergebnis, jeder Log und jeder Auftrag führt verpflichtend `contractVersion: 7` und `simVersion: "0.0.6"`.

## Raid-Freeze

| Schlüssel | Exakter Typ |
|-----------|-------------|
| `snapshot.resources` | `{ gold: safe integer, materials: safe integer }` |
| `snapshot.monsterSlots` | exakt 5 × `{ monsterId: non-empty string \| null, generation?: Integer ≥ 1 }` |
| `snapshot.activeTeam` | 1..5 × `{ heroId: non-empty string, temporaryFatigue: safe integer, temporaryInjury: safe integer }` |
| `snapshot.dungeon` | `DungeonGrid` mit 4096 Zellen und Koordinaten 0..63 |

Keine weiteren Werte, Formeln oder Balancing-Regeln sind Teil des v7-Snapshotvertrags. Dieser Stand ist **privat**: Er geht an den Server, nicht an den Angreifer.

## Ergebnislog und Auftrag

| Schlüssel | Exakter Typ |
|-----------|-------------|
| `log.stage` | `'heroes-win' \| 'monsters-win' \| 'timeout'` |
| `log.hash` | `^[0-9a-f]{8}$` |
| `log.events[].type` | `'move' \| 'attack' \| 'death' \| 'ambush' \| 'end'`; ein `ambush` trägt in `amount` die durchdrungene Rüstung |
| `log.events[].stage` | obige drei oder `'running'` |
| `log.trail[]` | `{ x: 0..63, y: 0..63, cell: 0..4, zoneId: ≥ -1 }`, jeder Schritt der Route in Reihenfolge; `-1` steht für „keine Zone“ |
| `log.units[]` | `{ id, side, role, maxHp, attack, defense, initiative, moveCooldown, attackCooldown, routeIndex, ambushZoneId }`; `routeIndex` zeigt auf eine Trail-Zelle, `ambushZoneId` ist die Zone der Platzierungsgruppe (`-1` sonst) |

## Angreifer-Sicht

| Schlüssel | Exakter Typ |
|-----------|-------------|
| `view.dungeon` | `DungeonGrid` wie im Freeze, aber ohne Platzierungsmarkierungen: Zellnummer 2 wird zu 0 |
| `view.contractVersion` / `view.simVersion` | wie im Freeze |
| `view.monsterSlots` / `view.resources` / `view.activeTeam` | **existieren nicht**; das Schema ist strikt und lehnt sie ab |

Die Sicht entsteht ausschließlich über `toPublicView`. Später kommen hier die Bonus-Schätze dazu, die der Angreifer markieren darf.
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
| `proto/upload` | vollständiger `RaidSnapshot` plus `tactics: string[][0..3]` mit genau einer Liste je aktivem Helden |
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

Unbekannte Codes, fehlende Pflichtfelder und zusätzliche Felder werden durch `.strict()` abgewiesen. Die Contract-Stände v1 bis v6 werden von v7 nicht akzeptiert.
