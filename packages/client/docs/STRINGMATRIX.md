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
| `visual/descriptor` | `TerrainTile`, `ActorDescriptor`, `FxDescriptor` inkl. stabilem Event-Seed, `VisualDelta` |
| `visual/observes` | `grid`, `route`, `combat`, `playbackTick` — Eingang des Observers |
| `world/tile-px` | `32` — Kantenlänge eines sichtbaren Tiles in Weltpixeln |
| `world/cell-px` | `8` — Kantenlänge einer Logikzelle in Weltpixeln |
| `window/id` | `'team'`, `'route'`, `'legend'`, `'actor:<kind>:<id>'` |
| `input/drop-command` | `{source, id, cell, screen}` — Ergebnis eines Drags |
| `input/drag-slop` | `5` px Weg, ab dem aus einem Kandidaten ein aktiver Zug wird |
| `input/gesture` | `undecided` → `drag` \| `pan`; ohne Weg bleibt es ein Klick |
| `render/camera-single` | `worldToScreen` existiert genau einmal; der Runtime-Ursprung kommt daraus |
| `render/route` | Marker folgen `route.path`; aktiver Hero-Index markiert Combat-Fortschritt ohne zweite Positionsquelle |
| `visual/route-index` | `routePointAt(path, index)` klemmt Actor-/FX-Indizes auf denselben Route-Punkt |
| `visual/actor-variant` | `actorVariant(id)` liefert identische deterministische Varianten in Leerlauf und Combat |
| `raid/trail` | Seit T1.1: `CombatLog.trail` (x/y/cell je Schritt) fließt in den Kampf-Hash; die Anzeige kann den Trail statt `route.path` nutzen |
| `phase/state` | `'tag' \| 'night' \| 'raid' \| 'result'` — Schleifenreihenfolge, einziger Owner `village/state.ts` |
| `phase/transitions` | erlaubt: `tag→night`, `night→raid`, `raid→result`, `result→tag`, `result→raid`; jeder andere Übergang wird verworfen |
| `phase/day` | Start `fixture.day` (18), Zähler hoch bei `result→tag`, Auftrag wird dabei gelöscht |
| `phase/actions` | `startNight`, `triggerRaid`, `completeRaid` (nur aus `raid`), `finishResult` (Nachfolge nach Auftragsstatus) |
| `view/id` | `'village' \| 'dungeon'` — Bühnenblick, phasenunabhängig, einziger Owner `ui/view.ts` |
| `view/default` | `'village'` — der erste Eindruck ist der Ort, nicht das Raster |
| `district/tone` | `'idle' \| 'accent' \| 'ok' \| 'alert'` — Kartenkante im Dorfblick, kein Ampelsystem |
| `district/id` | `rathaus`, `gilde`, `gehege` — Orte aus `village/settlement.ts` |
| `timeline/phase-label` | `Routen-Phase`, `Kampf-Phase`, `Ergebnis-Phase` — Beschriftung der drei Knöpfe |
| `timeline/scrub-readout` | `Tick 12/225 · Kampf-Phase` — Position und Phase im Scrubber |
| `timeline/aria` | `Raid-Phasen`, `Ein Tick zurück`, `Tick-Index`, `Wiedergabe fortsetzen`, `Wiedergabe pausieren` |

`ui/tabs` ist mit der alten visuellen Schicht entfallen. Die Sidebar schaltet
seit T1.2 nach `village/state.ts`; die alte lokale Tag/Nacht-Notiz ist
überholt. Die Welt bleibt die Navigation, der Editor bleibt in Nacht und Raid
aktiv — seine Sichtbarkeit hängt allein an der Phase, weil Bauen in der Nacht
passiert; der Blick ist eine Navigationsfrage und bindet das Werkzeug nicht.

Die Sidebar zeigt je Phase nur noch den Auftrag und eine Hauptaktion. Zahlen
und Zustände des Dorfs stehen im Dorfblick (`ui/village-view.tsx`), damit der
Ort nicht als Wertetabelle nebenbei existiert. Kennungen aus Roster und
Verteidiger-Gehege erscheinen nie roh: `ui/actor-label.ts` übersetzt sie in
Namen und Zählung.

Die Timeline-Klassen `raid-timeline`, `timeline-phase-nav`, `timeline-phase-step`,
`timeline-scrubber`, `timeline-scrub-step`, `timeline-scrub-readout`,
`timeline-phase`, `timeline-trail`, `timeline-clusters`, `timeline-cluster-type`,
`timeline-facts` und `timeline-hint` gehören zu `src/raid/raid-timeline.tsx`,
`phase-nav.tsx` und `phases.tsx`. Sie erscheinen ausschließlich in der
Raid-Phase und sind mit dem UI-Rebase nach `ui/styles/raid.css` überführt.
