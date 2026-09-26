# packages/client/docs/STRINGMATRIX.md

| Schlüssel | Bedeutung |
|-----------|-----------|
| `editor/brush1-2-4` | Pinselgrößen (4 = sichtbares Tile) |
| `editor/brush` | Aktiver Pinsel `'empty' \| 'wall' \| 'trap'` |
| `editor/marker` | `'start' \| 'boss' \| null` — Anker im Tile |
| `raid/tactics3` | 3 Regeln/Held, If-Then |
| `raid/job-id` | `fixture-raid-1` — Job-ID und Token des Probelaufs |
| `raid/seed` | `4242` — fester Fixture-Seed, keine Uhr, kein Zufall |
| `raid/floor` | `1` — Etage des Fixture-Auftrags |
| `raid/created-at` | `0` — feste Auftragszeit, Fristprüfung im Core |
| `raid/observed-at` | `1` — feste Beobachtungszeit |
| `raid/hero-id` | `hero-mara`, `hero-bram`, `hero-nell` |
| `raid/monster-id` | `monster-frost-1`, `monster-frost-2`, sonst `null` |
| `raid/status` | `completed`, `failed`, `expired` — lokaler Probelauf |
| `net/token` | Server-Token für Seed-Vergabe |
| `storage/dexie` | IndexedDB Name/Version |
| `visual/layer` | `'void' \| 'terrain' \| 'world' \| 'overlay'` |
| `visual/fx-kind` | `'dust' \| 'hit' \| 'spark' \| 'magic' \| 'smoke' \| 'blood' \| 'ambient'` |
| `visual/actor-kind` | `'hero' \| 'monster' \| 'boss'` |
| `visual/material-id` | `soil`, `stone`, `moss`, `wood`, `arcane` |
| `visual/descriptor` | `TerrainTile`, `ActorDescriptor`, `FxDescriptor`, `VisualDelta` |
| `visual/observes` | `grid`, `route`, `combat`, `playbackTick` — Eingang des Observers |
| `world/tile-px` | `32` — Kantenlänge eines sichtbaren Tiles in Weltpixeln |
| `world/cell-px` | `8` — Kantenlänge einer Logikzelle in Weltpixeln |
| `window/id` | `'team'`, `'route'`, `'legend'`, `'actor:<kind>:<id>'` |
| `input/drop-command` | `{source, id, cell, screen}` — Ergebnis eines Drags |
| `input/drag-slop` | `5` px Weg, ab dem aus einem Kandidaten ein aktiver Zug wird |
| `input/gesture` | `undecided` → `drag` \| `pan`; ohne Weg bleibt es ein Klick |
| `render/camera-single` | `worldToScreen` existiert genau einmal; der Runtime-Ursprung kommt daraus |
| `raid/trail` | Seit T1.1: `CombatLog.trail` (x/y/cell je Schritt) fließt in den Kampf-Hash; die Anzeige kann den Trail statt `route.path` nutzen |

`ui/tabs` und `ui/phase` sind mit der alten visuellen Schicht entfallen. Die
neue Shell hat Tag/Nacht als lokalen Zustand und die Welt als Navigation.
