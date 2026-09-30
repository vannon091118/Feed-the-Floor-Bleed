# packages/client/docs/REPOINDEX.md

| Pfad | Job |
| ------ | ----- |
| `index.html` | Vite-HTML-Entry mit `#app` |
| `vite.config.ts` | Vite + Preact-Plugin + `@floor/*`-Aliase |
| `tools/generate-assets.mjs` | Erzeugt die Dungeon-Spritesheets; liest Varianten, Wandhöhe und Zellmaß aus den Quellen, statt sie zu wiederholen |
| `tools/draw.mjs` | Die fünf Materialzeichner des Bodens |
| `tools/draw-wall.mjs` | Der Wandzeichner: Deckplatte, Fassade, Quaderlagen, Fuß |
| `tools/tile-shapes.mjs` | Gemeinsamer Kachelbausatz: Grundfläche, laufende Fuge, Körnung, Glanzpunkte |
| `tools/palette.mjs` | Stilregeln, Farbkörper, Mulberry32-Kopie und die Farbrechnungen `mix`, `saturate`, `shift` |
| `tools/pixel-buffer.mjs` | Beschreibbarer RGBA-Puffer als Ersatz für den Canvas-2D-Kontext im Build |
| `tools/png.mjs` | PNG-Encoder über `node:zlib`; keine neue Abhängigkeit (E5) |
| `tools/preview.mjs` | Vergrößerte Vorschau der Blätter zum Ansehen; Ausgabe nach `tools/_preview/`, bewusst unversioniert |
| `src/main.tsx` | Einstiegspunkt: rendert die Shell in `#app` |
| `src/vite-env.d.ts` | Vite-Client-Typen für CSS-Importe |
| `src/fixture-data.ts` | Read-only Fixture-Daten (Dorf, Starttag, Team, Monster, Auftrag); keine Wirtschaftsgröße, die steht in `village/balance.ts`; `Hero.tactics` trägt `TacticRule` aus `@floor/contracts` und keine Opaque-Strings mehr |
| `src/world/geometry.ts` | Weltmaße, Zell-zu-Welt-Umrechnung, Zell-Seed |
| `src/world/materials.ts` | Materialdefinitionen und deterministische Variantenwahl |
| `src/world/tiles.ts` | `CellType` → `TileDescriptor` (Höhe, Occlusion, Marker) |
| `src/world/descriptors.ts` | Reine Deskriptor-Typen für Observer und Runtime |
| `src/world/index.ts` | Barrel der gemeinsamen Definitionen |
| `src/visual/terrain.ts` | Grid → Terrain-Deskriptoren und Diff |
| `src/visual/actor-frame.ts` | Combat-Units/Events → Actor-Deskriptoren |
| `src/visual/combat-frame.ts` | Combat-Log/Route auf vollständigen Präsentationsrahmen |
| `src/visual/event-fx.ts` | Core-Event/Route → event-seeded FX-Deskriptor (`ambush` eingeschlossen, Menge aus `event.amount`) |
| `src/visual/fx-seed.ts` | Eventfelder → stabiler Seed für Präsentations-FX |
| `src/visual/route-actors.ts` | Leerlauf-Akteure aus der echten Route |
| `src/visual/route-index.ts` | Gemeinsames boundsafe Route-Index-Mapping |
| `src/visual/variant.ts` | Gemeinsame ID-basierte Actor-Variantenwahl |
| `src/visual/observer.ts` | Diffender Visual Observer, keine zweite Grid-Wahrheit |
| `src/visual/daylight.ts` | Tönung der vier Schleifenphasen als Überzugsebenen, Ziele und komplementäre Blendenstartwerte |
| `src/render/camera.ts` | Einzige World↔Screen-Transformation, Pan/Zoom/Clamp und Rahmung |
| `src/render/camera-controls.ts` | Pan, Zoom und Tastenschritt auf der Host-Fläche, ohne Zeigereinfang |
| `src/render/camera-keys.ts` | Tastenschritt der Kamera und die Props, die die Weltansicht fokussierbar machen |
| `src/render/layer-sprite.ts` | Lebensdauer eines Sprites in einer Ebene (Sichtbarkeit, Abbau) |
| `src/render/modes.ts` | Rendermodi `village \| editor \| raid` der Runtime |
| `src/render/layers.ts` | Ebenen-Namen und Z-Ordnung |
| `src/render/depth.ts` | Fußpunkt-basierte Tiefenschlüssel |
| `src/render/canvas.ts` | Gemeinsame Canvas- und Textur-Helfer |
| `src/render/atlas.ts` | Barrel für Actor-, Licht-, Tile- und Routentexturmodule |
| `src/render/actor-atlas.ts` | Prozedurale Actor-Silhouetten für Held, Monster und Boss |
| `src/render/base-monster-atlas.ts` | Granulare Textur je Basis-Monster, gezeichnet aus Palette und drei Elementen |
| `src/render/face.ts` | Gemeinsame Kopf-, Augen- und Schattenzeichnung der Actor-Texturen |
| `src/raid/combat-source.ts` | Rechnet den Core-Log des Fixture-Raids und liefert die Basisart je Verteidiger-Slot |
| `src/visual/actor-frame.ts` | Actor-Deskriptoren je Tick; setzt die Basisart in Core-Reihenfolge der Monster |
| `src/render/atmosphere-atlas.ts` | Gepufferte Glow- und Vignette-Texturen |
| `src/render/tile-atlas.ts` | Deterministische Boden- und Mauertexturen |
| `src/render/route-atlas.ts` | Gepufferte Leuchttexturen für Route-Marker |
| `src/render/filters.ts` | Materialfilter aus Materialparametern |
| `src/render/animation.ts` | Determinierte Animations-Helfer auf der Renderuhr |
| `src/render/runtime.ts` | Pixi `Application`, Ebenen, Ticker, Kamera-Bindung |
| `src/render/terrain.ts` | Persistente Boden- und Fake-3D-Wandsprites |
| `src/render/route.ts` | Persistente Route-Marker auf `route.path`, mit Combat-Position-Highlight |
| `src/render/actors.ts` | Persistente Actor-Sprites mit Schatten und Animation |
| `src/render/fx.ts` | Gepooltes FX-System ohne Objektallokation pro Treffer |
| `src/render/fx-styles.ts` | Stiltabelle je FX-Art |
| `src/render/lighting.ts` | Billiger Lichtrand im Screen-Raum |
| `src/render/assets.ts` | Manifest der Spriteblätter mit Frame-Deskriptor, Lade-Fallback und `tileFrame`; der Frame-Index kommt aus `tile.variant` |
| `src/render/dungeon-scene.ts` | Aufbau der Dungeon-Szene aus Observer-Deskriptoren |
| `src/render/editor-grid.ts` | Editorraster als `TilingSprite` in der Editor-Ebene |
| `src/render/editor-grid-atlas.ts` | Gepufferte Linientextur eines einzelnen Rasterfeldes |
| `src/render/editor-overlay.ts` | Pinselmarkierung und Lesemarken im Overlay |
| `src/render/village-layout.ts` | Weltmaße, Baumstellen und die Projektion des Dorfrasters in Weltpixel (`projectVillagePlot`); die Baugegenstand-Arten leiht es aus `village/balance`, einen Dorfbestand führt es nicht |
| `src/render/village-atlas.ts` | Pixeltexturen für Boden, Bäume, Gebäude und Bewohner |
| `src/render/village-ground.ts` | Unbeweglicher Dorfuntergrund aus Wiese, Bodenkacheln, Weg und Bäumen samt der gemeinsamen Sprite-Anlage `placeSprite` |
| `src/render/village-scene.ts` | Bewegliche Teile der Dorfszene: die Gebäude des Dorfbestands an ihren Plot-Zellen (der Klick meldet den Listenplatz), laufende Bewohner, `createVillageScene(textures, { plots, onBuildingClick })` und `update(ms)` |
| `src/render/village-view.ts` | Einbau der Dorfszene in die geteilte Runtime, Kamera-Rahmung; reicht die Plotquelle und den Klickweg durch |
| `src/input/pointer.ts` | Einheitlicher Pointer-Pfad für Maus und Touch |
| `src/input/hit-test.ts` | Screen → Zelle und Actor-Treffer über die Kamera |
| `src/input/drag.ts` | Drag-Lebenszyklus: Kandidat, Slop, Abschluss-Command |
| `src/input/drag-target.ts` | Trefferauflösung und Zwischenzustand eines Drags |
| `src/input/arrows.ts` | Einzige Abbildung Pfeiltaste → Richtung für Fensterrahmen und Weltansicht |
| `src/window/store.ts` | Fenster-Registry, Fokus und Z-Order als Signals |
| `src/window/drag.ts` | Zug- und Größen-Geometrie: sichtbare Fläche, Kopfklemme, Mindestgrößen, Zeigerfang, Zug- versus Klickgrenze, Schubladengrenze (`SHEET_MAX_WIDTH`) |
| `src/window/fit.ts` | Hält die Fensterhöhe am gemessenen Inhaltsblock des DOM |
| `src/window/keys.ts` | Tastenschritt des Fensterrahmens (Pfeiltasten, Umschalt skaliert) und seine Tastatur-Props |
| `src/window/window.tsx` | Verschiebbares und per Tastatur bewegbares Kontextfenster mit Resize-Griff, inhaltsangepasster Höhe und Inhaltsblock als Messstelle |
| `src/window/window-layer.tsx` | Fensterschicht über der Welt, berechnet die Inhalts-Signatur |
| `src/showcase/controls.ts` | Viewport-Steuerung: Pan, Zoom, Klick, Drag |
| `src/showcase/scene.ts` | Treiber, der Observer, Views und Kamera schaltet |
| `src/ui/shell.tsx` | Layout: Topbar und Bühne, setzt die Tagesstimmungsebenen auf den Überzug |
| `src/ui/daylight-fade.ts` | Fährt die Blende auf den Überzugsebenen ein, ohne dass der Browser sie umkehrt |
| `src/ui/topbar.tsx` | Wortmarke, Ressourcenstreifen aus dem Dorf-Owner, Phasenanzeige, Ansichtsumschalter, Fenstertabs |
| `src/ui/view.ts` | Blick-Signal `village \| dungeon`, bewusst kein Phasenzustand |
| `src/ui/view-switch.tsx` | Segmentierter Umschalter zwischen Dorf- und Dungeon-Blick |
| `src/ui/stage.tsx` | Bühne: Pixi-Host, Weltbeschriftung, Launcher und Fensterlayer |
| `src/ui/village-host.tsx` | Weltbeschriftung über der Dorfszene, keine eigene Pixi-Runtime |
| `src/ui/scene-switch.ts` | Hält genau eine lebende Szene in der stabilen Runtime; `villagePlots()` ist die Naht zum Dorfbestand (Spalten aus dem Store, Zeilen aus der Config) |
| `src/ui/window-launcher.tsx` | Einzige Startrampe für Kontextfenster über der Welt |
| `src/ui/window-tabs.tsx` | Offene Kontextfenster als Tabs in der Topbar |
| `src/ui/roster-list.tsx` | Gildenliste des Team-Fensters, eine Darstellung für den Gildenzustand |
| `src/ui/stats.tsx` | Beschriftete Wertzeilen statt offener Label-Wert-Listen |
| `src/ui/phase-badge.tsx` | Schleifen-Anzeige mit laufendem Tag in der Topbar |
| `src/ui/phase-panels.tsx` | Phasen-Panels: Auftrag und Hauptaktion je Phase |
| `src/ui/actor-label.ts` | Kennung → sprechender Name für Fenster und Werkzeugstatus |
| `src/ui/building-label.ts` | `BuildingKind` → sprechender Ortsname, einzige Label-Quelle |
| `src/ui/drop-status.tsx` | Rückmeldung über den letzten Zug im Editor |
| `src/ui/floor-purchase.tsx` | Etage-Kauf im Tag-Panel als reine Ableitung: Preisvorschau aus der Config, Knopf und Fehlbetrag aus dem Bestand gerechnet, das Kommando aus `village/floors`; kein eigener Zustand |
| `src/ui/editor-panel.tsx` | DOM-Editorraster mit 16×16 sichtbaren Feldern |
| `src/ui/settlement-toast.tsx` | Rückkehrbilanz als reine Ableitung aus dem Phase-Owner; sichtbar nur am Tag, kein Bedienelement und kein eigener Sichtbarkeitszustand; die Ansageregion steht dauerhaft und ist ohne Meldung leer |
| `src/ui/phase-windows.tsx` | Fensterinhalt der Phase und des Editors hinter festen IDs |
| `src/ui/window-content.tsx` | Fenster-ID → Inhalt, eine Quelle für die Fensterschicht |
| `src/ui/world-host.tsx` | Stabiler DOM-Host und Lebenszyklus der Pixi-Runtime, zugleich fokussierbares Tastaturziel der Kamera |
| `src/ui/editor-controls.tsx` | Pinselauswahl und Zurücksetzen |
| `src/ui/panels.tsx` | Inhalte der Kontextfenster samt Steuerungslegende mit den Tastenhinweisen; das Gebäudefenster liest den Dorfbestand über den Listenplatz, Startbasis und Attraktivität kommen aus `village/balance`; die Routenanzeige nennt Modus, Schritte und Bewegungspunkte |
| `src/icons/resource-icon.tsx` | SVG-Icons der Ressourcenwerte in der Topbar |
| `src/resources/catalog.ts` | Feste Ressourcen-IDs, Labels und Icons |
| `src/ui/styles/index.css` | Einstiegspunkt der Oberflächen-Styles mit fester Importreihenfolge |
| `src/ui/styles/tokens.css` | Gestaltungsraster: Farbe, Abstand, Radius, Typografie |
| `src/ui/styles/base.css` | Reset, Seitenhintergrund, Fokus, reduzierte Bewegung |
| `src/ui/styles/shell.css` | App-Rahmen, Topbar, Bühnenraster, Viewport, Tagesüberzug und Ebenenblende |
| `src/ui/styles/panels.css` | Fenster-Panelflächen, Wertzeilen, Gildenliste, Buttons, Werkzeugstatus |
| `src/ui/styles/windows.css` | Kontextfenster über der Bühne; unter 721 px Schubladenanordnung an der unteren Kante |
| `src/ui/styles/editor.css` | Pinselwahl und Editorraster |
| `src/ui/styles/raid.css` | Auftrag, Urteil und Hash |
| `src/dungeon-editor/model.ts` | Pure Editor-Regeln (Pinsel mit Leer/Wand/Platzierung, 4x4-Tiles, Marker) und `startDungeon` mit den zwei Platzierungsgruppen des Probelaufs |
| `src/dungeon-editor/state.ts` | Einziger Owner von Grid, Pinsel und Route |
| `src/village/phase.ts` | Phase-Union in Schleifenreihenfolge, erlaubte Übergänge, reine Entscheidungsfunktion |
| `src/village/state.ts` | DayNightState-Signal (`phase`, `day`, `job`, `village`, `daySettlement`), Tagesabrechnung im Übergang `result → tag` in `setPhase` — Material aus dem Werkstattertrag, Gold aus der Beute des Laufs; der Übergang wird ohne die Beute abgewiesen, damit kein Tag still 0 Gold bucht. Dazu `commitVillage` als Schreibpfad der Baukommandos; ein Gebäude trägt seinen Grundriss, und der Startbestand legt Rathaus und Gilde aus der Config an |
| `src/village/commands.ts` | Kommandoschicht des Dorfes: `buildBuilding`, `upgradeBuilding`, `extendLand` — nur am Tag, mit Deckung, Arbeiterkapazität und Platzierungsprüfung, jede Ablehnung ein Ergebnis mit Grund |
| `src/village/floors.ts` | Das Etage-Kommando `buyFloor`: die nächste Etage zum freigegebenen quadratischen Preis, nur am Tag über denselben Schreibpfad `commitVillage`, jede Ablehnung ein Ergebnis mit Grund |
| `src/village/balance.ts` | Einzige Quelle aller Dorf-Stellschrauben: tief eingefrorene und tief unveränderliche Config mit benannten Gruppen, vom Startbestand über Startarbeiterbasis, die Zellen der beiden festen Startorte und Attraktivität bis zu Etagen- und Platzpreis |
| `src/village/economy.ts` | Reine Dorfregeln: Bau-, Ausbau-, Ertrags-, Kapazitäts-, Land- und Slotkosten — jede Funktion nimmt ihre Balance ausdrücklich entgegen, prüft Stufe, Etage, Platz und Landausgang auf Ganzzahl und wirft nie |
| `src/village/phase-actions.ts` | Schleifen-Kommandos: Nacht starten, Raid auslösen (lädt den Log), Ergebnis abschließen — ein abgeschlossener Auftrag reicht die Beute aus `raid/loot-source.ts` an den Tagesabschluss und räumt den Log danach auf |
| `src/village/settlement.ts` | Dorfblick als reine Ableitung aus Phase-Owner und Fixture, ohne Wirtschaft |
| `src/village/loot.ts` | Die freigegebene Goldformel als reine Regel: `goldForOpponent` und `goldForRun` nehmen ihre Balance ausdrücklich entgegen, rechnen ganzzahlig und weisen einen ungültigen Gegner ab, statt eine halbe Beute zu zahlen |
| `src/village/plot.ts` | Platzierungsgeometrie des Dorfes: Grundriss, Ganzzelligkeit, Rastergrenze, Überlappung, Kantennachbarn, horizontale Landerweiterung — reine Funktionen, keine Wirtschaftszahlen; Abnehmer ist die Kommandoschicht |
| `src/village/index.ts` | Barrel der Schleifendomäne (Phase, Aktionen, Kommandos, Blick, Zustand); `plot` ist bewusst nicht enthalten, weil die Oberfläche es nicht aufruft |
| `src/raid/fixture-raid.ts` | Versionierter Upload und lokaler Fixture-Auftrag; `fixtureAufstellung` ist die eine Ableitung des Teams und der Verteidiger für Upload und Timeline, `snapshotInput(grid, floor)` daraus die Kampf-Eingaben beider Wege |
| `src/raid/combat-source.ts` | Einziger Besitzer des Raid-Logs: Core-Aufruf, Lade-/Entlade-Pfad, Plan-Synchronisierung |
| `src/raid/loot-source.ts` | Die Beute des geladenen Laufs: `fallenLootProfiles` ordnet die Todesereignisse über die **belegten** Plätze den eingefrorenen Slots zu und löst Stärke und Generation über `slotLootProfile` auf; der Boss trägt nichts bei. Erster Leser von `goldForRun` im Spielerpfad |
| `src/raid/raid-panel.tsx` | Probelauf-Panel, reicht den terminalen Auftrag an die Schleife weiter |
| `src/raid/panel.tsx` | Reine Ergebnis-Darstellung eines TerminalRaidJob; die Stufenworte liest sie als `STAGE_LABELS` aus `timeline-model.ts`, es gibt keinen zweiten Formulierer daneben |
| `src/raid/playback.ts` | Playback-Store: Log, Tick, Pause, abgeleitete Routenposition |
| `src/raid/timeline-model.ts` | Reine Abschnitts- und Phasenmodelle des Logs; die Überlebendenzahlen kommen aus `@floor/sim-core`; Trail-Marken sind Platzierung, Spawn und Boss; `ambushEvents` liefert jedes Hinterhalt-Ereignis einzeln mit Tick und Ziel |
| `src/raid/timeline.tsx` | Re-Export von Timeline und Steuerung für die Shell |
| `src/raid/raid-timeline.tsx` | `TimelineTransport` (Scrubber, Play/Pause) und die drei Phasenreihen |
| `src/raid/phase-nav.tsx` | Drei Phasen-Knöpfe, setzen den Scrubber auf den Phasenbeginn |
| `src/raid/phases.tsx` | Routen-, Kampf- und Ergebnisdarstellung der Timeline; die Ergebniszahlen liest sie über `summarizeCombat`, den Hinterhalt zeigt sie einzeln statt nur als Klassen-Zählung |
| `test/dungeon-editor.test.ts` | State-/Model-Tests der Editor-Logik |
| `test/village-phase.test.ts` | Phase-Übergänge, Skip-Verbot und Store-Verhalten |
| `test/day-night-loop.test.ts` | End-to-End-Loop mit Fake-Timern unter 5 s |
| `test/raid-job.test.ts` | Upload-Gültigkeit, Hash und Auftragszustände |
| `test/raid-combat-source.test.ts` | Die Naht beider Kampfwege: Auftrag und Timeline liefern Hash und Kurzfassung desselben Laufs, die Etage verändert den Log nicht, und die Gegenprobe stellt sicher, dass der Gleichheitstest ohne die Nachwirkung rot wird |
| `test/visual-foundation.test.ts` | Tests für World-Definitionen, Kamera, Depth, Observer |
| `test/asset-palette.test.ts` | Farbwerte und Determinismus der Generator-Werkzeuge: `shift`, `mix`, `saturate`, PRNG, Puffer und PNG-Encoder |
| `test/asset-frames.test.ts` | Frame-Naht: Index aus `tile.variant` über alle 4096 Zellen, Frame-Anzahl gegen `materials.ts`, Wandhöhe gegen `tiles.ts`, Fallback ohne Textur |
| `test/asset-generator.test.ts` | Der Generator liefert zwei Läufe bytegleich und schreibt saubere PNG-Struktur |
| `test/asset-sheets.test.ts` | Pinnt die committed Blätter an ihre Quelle: Boden-Abmessung gegen `materials.ts`-Varianten, Wand-Höhe gegen `tiles.ts` — macht eine veraltete Datei rot statt prozedural fallen zu lassen |
| `test/render-animation.test.ts` | Periodik, Determinismus, Grenzen und Amplituden der Render-Animation |
| `test/input-drag.test.ts` | Slop-Verhalten: ein Down ohne Weg erzeugt keinen Drop |
| `test/village-settlement.test.ts` | Dorfblick: Name, Tag, Phase und Roster ohne Kopie |
| `test/village-plot.test.ts` | Platzierungsinvarianten: Überlappung, Rastergrenze mit Begründung, Kantennachbarschaft ohne Diagonalen, Landerweiterung, Determinismus |
| `test/village-economy.test.ts` | Regelinvarianten: Wachstum und Ganzzahligkeit jeder Kostenfunktion, die Grenzfälle (Maximalstufe, Etage, Platznummer, Land-Schritt), Werkstattkapazität, Ertragssumme, bezahlbarer Startbestand |
| `test/floor-purchase.test.ts` | Die Kaufanzeige als Ableitung: Preis und Fehlbetrag aus dem Bestand, kein gemerkter Ablehnungstext, und der Knopf zahlt über denselben Store |
| `test/village-balance-guards.test.ts` | Eingabewächter: NaN, Unendlichkeit, gebrochene und negative Werte als Stufe, Etage, Platz und Landausgang mit dem erwarteten Ablehnungsgrund, die Baupreis-Kopie und drei absolute Werte aus der Freigabetabelle |
| `test/village-day-close.test.ts` | Tagesabrechnung am Store: genau einmal je Rückkehr, auch nach Niederlage, kein Doppelbuch auf dem Retry-Weg |
| `test/village-commands.test.ts` | Die drei Dorf-Kommandos: Preisabbuchung, Phasengrenze, Gangbarkeit, Kapazität, Ausbaustufen, Landschritt — jeweils mit dem Bestand vor und nach dem Befehl |
| `test/village-floors.test.ts` | Das Etage-Kommando: quadratischer Preis, Etage für Etage, Ablehnung ohne Deckung mit unberührtem Bestand, Ablehnung außerhalb des Tags |
| `test/village-command-guards.test.ts` | Bestandsinvarianten am Store: negative, gebrochene und verkleinerte Bestände werden abgewiesen, abgelehnte Befehle hinterlassen nichts, der gebaute Ertrag wird gutgeschrieben, und die beiden festen Startorte liegen mit ihren freigegebenen Zellen im Bestand und sind gegen Überbauung geschützt |
| `test/stage-view.test.ts` | Blickwechsel verändert die Spielphase nicht |
| `test/world-presentation.test.ts` | Dorfszene an der Naht der App: leerer Bestand zeichnet keinen Ort, ein gebautes Haus steht nach einem Takt an seiner Plot-Zelle, Klicks melden Listenplätze; dazu deterministische Bewohnerbewegung und Kamera-Clamp beider Welten |
| `test/window-routing.test.ts` | Fenster-ID → Inhalt, Phasenaktion über eine stabile Fenster-ID |
| `test/daylight.test.ts` | Blendenrechnung und Stylesheet bleiben beieinander |
| `test/keyboard-access.test.ts` | Fenster- und Kameraschritt samt der geteilten Pfeiltasten-Abbildung |
| `test/keyboard-wiring.test.ts` | Verdrahtung der Tastaturpfade: Inhalt-Grenze, Schublade, Kamera-Bindung, Legendentexte |
| `docs/*` | Pflicht-Doku dieser Domäne |

Der Client hat wieder einen Einstiegspunkt. `world`, `visual`, `render`, `input`,
`window` und `showcase` bilden die sichtbare visuelle Basis; `dungeon-editor`
bleibt der einzige Grid-Owner. `village` besitzt die Tag/Nacht/Raid-Phase, den
Dorfbestand und die Dorfregeln und leitet daraus den Dorfblick ab, `raid`
rechnet den Fixture-Auftrag lokal. Die Shell ist nur noch Layout; Topbar,
Bühne, Launcher und Fenster lesen ihre Stores selbst — die Ressourcenanzeige
liest den Bestand aus `village/state.ts` und nicht aus der Fixture. `ui/view.ts`
hält den Blick auf die Bühne, der bewusst keine Phase ist. `ui/world-host.tsx`
erzeugt genau einen Pixi-Host, `ui/scene-switch.ts` tauscht darin Dorf- und
Dungeon-Szene. Bedient wird mit Zeiger und Tastatur: Fensterrahmen und
Weltansicht sind fokussierbar, ihre Schrittlogik liegt in `window/keys.ts` und
`render/camera-keys.ts`; die Richtung liefert beiden `input/arrows.ts`.

Die Wirtschaftskette läuft in eine Richtung: `village/balance.ts` (Zahlen) →
`village/economy.ts` (Regeln, Config als Parameter) → `village/commands.ts`
(Entscheidung und Schreiben) → `village/state.ts` (Bestand und Buchung) →
Topbar und die Rückkehrbilanz (`ui/settlement-toast.tsx`). Verdrahtet sind der Tagesertrag, die Beute und der Etage-Kauf;
Bauen, Ausbauen und Landerweiterung sind als Kommandos gebaut, haben aber noch
keinen Aufrufer in der Oberfläche, und der Slotpreis hat ebenfalls noch keinen. Die Dorfszene auf der Bühne zeichnet dagegen den Store:
`ui/scene-switch.ts` reicht den Bestand als `villagePlots()` hinein, und
`render/village-layout.ts` projiziert die Zellen in Weltpixel.
`raid/fixture-raid.ts` sendet inzwischen den Bestand des Dorfes statt des
Startbestands.
