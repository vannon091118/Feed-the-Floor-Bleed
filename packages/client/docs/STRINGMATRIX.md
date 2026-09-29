# packages/client/docs/STRINGMATRIX.md

| Schlüssel | Bedeutung |
|-----------|-----------|
| `editor/brush1-2-4` | Pinselgrößen (4 = sichtbares Tile) |
| `editor/brush` | Aktiver Pinsel `'empty' \| 'wall' \| 'trap'` |
| `editor/marker` | `'start' \| 'boss' \| null` — Anker im Tile |
| `raid/tactics3` | höchstens 3 Regeln je Held; jede ist eine `TacticRule` aus `@floor/contracts` (`{ ability, when? }`, `when` fehlend heißt `immediate`). Die Fixture schreibt Regeln, die Anzeige führt sie als Ableitung |
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
| `visual/fx-kind` | `'dust' \| 'hit' \| 'spark' \| 'magic' \| 'smoke' \| 'blood' \| 'ambush' \| 'ambient'` |
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
| `raid/trail` | Seit T1.1: `CombatLog.trail` (x/y/cell je Schritt) fließt in den Kampf-Hash; seit Contract v7 trägt jeder Schritt zusätzlich seine `zoneId`, und die Anzeige kann den Trail statt `route.path` nutzen |
| `raid/ambush-entry` | `Hinterhalt bei Tick 143: ein Verteidiger überrascht einen Helden` — ein Eintrag je `ambush`-Ereignis; Tick und Ziel in Worten, keine Kennung aus dem Log |
| `phase/state` | `'tag' \| 'night' \| 'raid' \| 'result'` — Schleifenreihenfolge, einziger Owner `village/state.ts` |
| `village/building-kind` | `'hall' \| 'guild' \| 'house' \| 'workshop'` — Union in `village/balance.ts`, von der Renderer-Seite nur entlehnt |
| `village/building-level` | Ganzzahl ab 1, erzwungen in `village/economy.ts`; letzte Stufe je Art steht in `BALANCE.buildings.<art>.maxLevel`, der Ausbaupreis ist `upgradeCoefficient · n²` |
| `village/resource` | `gold`, `materials` — Form wie `Resources` in `fixture-data.ts`; Anzeige über `resources/catalog.ts`, Bestand in `dayNight.village.resources` |
| `village/land` | `dayNight.village.landColumns`, Startwert `BALANCE.start.landColumns`; eine Erweiterung muss ein ganzes Vielfaches von `columnsPerStep` sein, die Höhe des Rasters steht fest in `BALANCE.start.landRows` und wächst nie |
| `village/buildable` | `BALANCE.buildings.<art>.buildable` — `false` für Rathaus und Gilde: feste Startorte werden nie gebaut, und das steht als Feld und nicht mehr nur im Kommentar |
| `village/day-settlement` | `daySettlement: DaySettlement \| null` — `day` des abgerechneten Tages und `materials` als Gutschrift; gesetzt nur im Übergang `result → tag` |
| `village/floors` | `dayNight.village.floors`, Startwert `1` (Zählungsbeginn, Etage 1 gehört zum Ausgang); erste kaufbare Etage `BALANCE.dungeon.firstPaidFloor`, Preis `floorBase · n²`; geschrieben nur durch `buyFloor` in `village/floors.ts` |
| `village/store-key` | `dayNight` — ein Signal für Phase, Tag, Auftrag, Dorfbestand und Abrechnung; zwei Schreibpfade, über die Phase getrennt: `setPhase` bucht im Übergang `result → tag` ab, `commitVillage` schreibt die Kommandos am Tag |
| `economy/rejection` | `below-first-level`, `above-max-level`, `worker-capacity`, `below-start-columns`, `not-wider`, `not-a-whole-step`, `below-first-paid-floor`, `slot-out-of-range` — unterscheidbare Gründe, kein Wurf-Fehler; eine kaputte Werkstattrechnung ergibt 0 und lehnt nicht ab |
| `command/rejection` | `not-day-phase`, `not-buildable`, `not-affordable`, `unknown-building` — dazu die Gründe aus `plot` (`not-a-cell`, `out-of-bounds`, `overlaps`) und aus `economy`; jeder Grund nennt seinen Grenzwert oder Preis |
| `phase/transitions` | erlaubt: `tag→night`, `night→raid`, `raid→result`, `result→tag`, `result→raid`; jeder andere Übergang wird verworfen |
| `phase/day` | Start `fixture.day` (18), Zähler hoch bei `result→tag`, Auftrag wird dabei gelöscht |
| `phase/actions` | `startNight`, `triggerRaid`, `completeRaid` (nur aus `raid`), `finishResult` (Nachfolge nach Auftragsstatus) |
| `phase/tag-note` | `Der Ort ist die Welt selbst, die Gilde steht im Gildenfenster.` — Verweis des Tag-Panels auf Ort und Gilde |
| `balance/keys` | `start`, `buildings`, `workshop`, `workers`, `attraction`, `land`, `dungeon` — benannte Gruppen der eingefrorenen Dorfconfig, jede mit deutschem Doc-Kommentar darüber, was ein Verstellen bewirkt |
| `view/id` | `'village' \| 'dungeon'` — Bühnenblick, phasenunabhängig, einziger Owner `ui/view.ts` |
| `view/default` | `'village'` — der erste Eindruck ist der Ort, nicht das Raster |
| `timeline/phase-label` | `Routen-Phase`, `Kampf-Phase`, `Ergebnis-Phase` — Beschriftung der drei Knöpfe |
| `timeline/scrub-readout` | `Tick 12/225 · Kampf-Phase` — Position und Phase im Scrubber |
| `timeline/aria` | `Raid-Phasen`, `Ein Tick zurück`, `Tick-Index`, `Wiedergabe fortsetzen`, `Wiedergabe pausieren` |
| `launcher/aria` | `Aktion`, `Dungeon-Editor`, `Gildenroster`, `Routenbilanz`, `Steuerung` jeweils mit dem Zusatz `als Fenster öffnen` — sichtbarer Text und ARIA-Beschriftung nennen dasselbe Ziel |
| `window/aria` | Der Fensterkopf ist die Beschriftung (`aria-labelledby` auf die Titelzeile), der Schließen-Knopf heißt `Fenster schließen`, der Tab-Knopf `<Titel> schließen` |
| `window/fit-height` | Fensterhöhe = Inhalt plus 40 px Kopf, mindestens 120 px, höchstens der Platz von der Oberkante bis zur Falz — der Inhalt scrollt dann im Fenster, der Kopf bleibt sichtbar |

`ui/tabs` ist mit der alten visuellen Schicht entfallen. Das Phasenfenster
schaltet seit T1.2 nach `village/state.ts`; die alte lokale Tag/Nacht-Notiz ist
überholt. Die Welt bleibt die Navigation, der Editor bleibt in Nacht und Raid
aktiv — seine Sichtbarkeit hängt allein an der Phase, weil Bauen in der Nacht
passiert; der Blick ist eine Navigationsfrage und bindet das Werkzeug nicht.

Das Phasenfenster zeigt je Phase nur noch den Auftrag und eine Hauptaktion.
Der Ort ist die Welt selbst: `ui/village-host.tsx` beschriftet sie, ein
angeklicktes Dorfort öffnet sein Kontextfenster. Die Gilde steht als
`RosterList` im Team-Fenster, damit der Ort nicht als Wertetabelle nebenbei
existiert. Kennungen aus Roster
und Verteidiger-Gehege erscheinen nie roh: `ui/actor-label.ts` übersetzt sie in
Namen und Zählung, `ui/building-label.ts` die Dorforte in Rathaus, Gilde,
Wohnhaus und Werkstatt.

Die Timeline-Klassen `raid-timeline`, `timeline-phase-nav`, `timeline-phase-step`,
`timeline-scrubber`, `timeline-scrub-step`, `timeline-scrub-readout`,
`timeline-phase`, `timeline-trail`, `timeline-clusters`, `timeline-cluster-type`,
`timeline-events`, `timeline-event`, `timeline-facts` und `timeline-hint`
gehören zu `src/raid/raid-timeline.tsx`,
`phase-nav.tsx` und `phases.tsx`. Sie erscheinen ausschließlich in der
Raid-Phase und sind mit dem UI-Rebase nach `ui/styles/raid.css` überführt.
`timeline-scrubber` klebt dabei am Oberkant des Fensterinhalts: die
Wiedergabe-Steuerung muss ohne Scrollen erreichbar bleiben, während die
Trail-Zellen darunter durchlaufen.

Die Topbar bleibt auf jeder Breite eine Zeile (`flex-wrap: nowrap`). Ihre Höhe
ist damit fest, und Kontextfenster stehen immer darunter; unter 1040 px
verschwindet der Markenname, die Fenstertabs schrumpfen und scrollen statt die
Schiene umzubrechen. Bricht sie um, läge sie über dem Fensterkopf und nähme
dem Fenster die Klicks — deshalb ist Umbruch hier ausgeschlossen und nicht
nur unerwünscht.
