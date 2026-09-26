# packages/client/docs/REPOINDEX.md

| Pfad | Job |
|------|-----|
| `index.html` | Vite-HTML-Entry mit `#app` |
| `vite.config.ts` | Vite + Preact-Plugin + `@floor/*`-Aliase |
| `src/main.tsx` | Einstiegspunkt: rendert die Shell in `#app` |
| `src/vite-env.d.ts` | Vite-Client-Typen für CSS-Importe |
| `src/fixture-data.ts` | Read-only Fixture-Daten (Dorf, Ressourcen, Team, Monster, Auftrag) |
| `src/world/geometry.ts` | Weltmaße, Zell-zu-Welt-Umrechnung, Zell-Seed |
| `src/world/materials.ts` | Materialdefinitionen und deterministische Variantenwahl |
| `src/world/tiles.ts` | `CellType` → `TileDescriptor` (Höhe, Occlusion, Marker) |
| `src/world/descriptors.ts` | Reine Deskriptor-Typen für Observer und Runtime |
| `src/world/index.ts` | Barrel der gemeinsamen Definitionen |
| `src/visual/terrain.ts` | Grid → Terrain-Deskriptoren und Diff |
| `src/visual/actor-frame.ts` | Combat-Units/Events → Actor-Deskriptoren |
| `src/visual/combat-frame.ts` | Combat-Log/Route auf vollständigen Präsentationsrahmen |
| `src/visual/event-fx.ts` | Core-Event/Route → event-seeded FX-Deskriptor |
| `src/visual/fx-seed.ts` | Eventfelder → stabiler Seed für Präsentations-FX |
| `src/visual/route-actors.ts` | Leerlauf-Akteure aus der echten Route |
| `src/visual/route-index.ts` | Gemeinsames boundsafe Route-Index-Mapping |
| `src/visual/variant.ts` | Gemeinsame ID-basierte Actor-Variantenwahl |
| `src/visual/observer.ts` | Diffender Visual Observer, keine zweite Grid-Wahrheit |
| `src/render/camera.ts` | Einzige World↔Screen-Transformation, Pan/Zoom/Clamp |
| `src/render/layers.ts` | Ebenen-Namen und Z-Ordnung |
| `src/render/depth.ts` | Fußpunkt-basierte Tiefenschlüssel |
| `src/render/canvas.ts` | Gemeinsame Canvas- und Textur-Helfer |
| `src/render/atlas.ts` | Barrel für Actor-, Licht-, Tile- und Routentexturmodule |
| `src/render/actor-atlas.ts` | Prozedurale Actor-Silhouetten |
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
| `src/input/pointer.ts` | Einheitlicher Pointer-Pfad für Maus und Touch |
| `src/input/hit-test.ts` | Screen → Zelle und Actor-Treffer über die Kamera |
| `src/input/drag.ts` | Drag-Lebenszyklus: Kandidat, Slop, Abschluss-Command |
| `src/input/drag-target.ts` | Trefferauflösung und Zwischenzustand eines Drags |
| `src/window/store.ts` | Fenster-Registry, Fokus und Z-Order als Signals |
| `src/window/window.tsx` | Verschiebbares Kontextfenster mit Resize-Griff |
| `src/window/window-layer.tsx` | Fensterschicht über der Welt |
| `src/showcase/combat-source.ts` | Core-Combat-Log als Positionsquelle |
| `src/showcase/controls.ts` | Viewport-Steuerung: Pan, Zoom, Klick, Drag |
| `src/showcase/scene.ts` | Treiber, der Observer, Views und Kamera schaltet |
| `src/ui/shell.tsx` | Reines Layout: Topbar, Bühne, Sidebar |
| `src/ui/topbar.tsx` | Wortmarke, Phasenanzeige, Ansichtsumschalter, live gelesener Ressourcenstreifen, Werkzeuge |
| `src/ui/view.ts` | Blick-Signal `village \| dungeon`, bewusst kein Phasenzustand |
| `src/ui/view-switch.tsx` | Segmentierter Umschalter zwischen Dorf- und Dungeon-Blick |
| `src/ui/stage.tsx` | Bühne: genau eine Ansicht im Viewport, Fensterlayer darüber |
| `src/ui/sidebar.tsx` | Sidebar: Panel der Phase, Editorwerkzeug nur im Dungeon-Blick |
| `src/ui/building-card.tsx` | Baukarte mit Bau- bzw. Ausbautaste, Kosten und Arbeiterzuweisung |
| `src/ui/village-places.tsx` | Ortskarten, Lager mit Beuteverkauf, Nachtprotokoll |
| `src/ui/village-feedback.tsx` | `runVillageAction` und die sichtbare Rückmeldung jeder Dorfaktion |
| `src/ui/village-view.tsx` | Dorfblick: Kopfzeile, Kennzahlen und Komposition der Abschnitte |
| `src/ui/roster-list.tsx` | Gildenliste, geteilt von Dorfblick und Team-Fenster |
| `src/ui/stats.tsx` | Beschriftete Wertzeilen statt offener Label-Wert-Listen |
| `src/ui/phase-badge.tsx` | Schleifen-Anzeige mit laufendem Tag in der Topbar |
| `src/ui/phase-panels.tsx` | Phasen-Panels: Auftrag und Hauptaktion je Phase |
| `src/ui/actor-label.ts` | Kennung → sprechender Name für Fenster und Werkzeugstatus |
| `src/ui/drop-status.tsx` | Rückmeldung über den letzten Zug im Editor |
| `src/ui/window-tools.tsx` | Schnellfenster der Topbar mit kaskadierenden Startlagen |
| `src/ui/window-content.tsx` | Fenster-ID → Inhalt, eine Quelle für die Fensterschicht |
| `src/ui/world-host.tsx` | Stabiler DOM-Host und Lebenszyklus der Pixi-Runtime |
| `src/ui/editor-panel.tsx` | DOM-Editorraster mit 16×16 sichtbaren Feldern |
| `src/ui/editor-controls.tsx` | Pinselauswahl und Zurücksetzen |
| `src/ui/panels.tsx` | Inhalte der Kontextfenster |
| `src/ui/styles/index.css` | Einstiegspunkt der Oberflächen-Styles mit fester Importreihenfolge |
| `src/ui/styles/tokens.css` | Gestaltungsraster: Farbe, Abstand, Radius, Typografie |
| `src/ui/styles/base.css` | Reset, Seitenhintergrund, Fokus, reduzierte Bewegung |
| `src/ui/styles/shell.css` | App-Rahmen, Topbar, Bühnenraster, Viewport |
| `src/ui/styles/village.css` | Gebietskarten, Gildenliste, Belegungsbalken |
| `src/ui/styles/panels.css` | Sidebar-Flächen, Wertzeilen, Buttons, Werkzeugstatus |
| `src/ui/styles/windows.css` | Kontextfenster über der Bühne |
| `src/ui/styles/editor.css` | Pinselwahl und Editorraster |
| `src/ui/styles/raid.css` | Auftrag, Urteil und Hash |
| `src/dungeon-editor/model.ts` | Pure Editor-Regeln (Pinsel, 4x4-Tiles, Marker) |
| `src/dungeon-editor/state.ts` | Einziger Owner von Grid, Pinsel und Route |
| `src/village/phase.ts` | Phase-Union in Schleifenreihenfolge, erlaubte Übergänge, reine Entscheidungsfunktion |
| `src/village/state.ts` | DayNightState-Signal (`phase`, `day`, `job`), einziger Schreibpfad `setPhase` |
| `src/village/phase-actions.ts` | Schleifen-Kommandos: Nacht starten, Raid auslösen, Ergebnis abschließen |
| `src/village/settlement.ts` | Dorfblick als reine Ableitung aus Phase-Owner und Fixture, ohne Wirtschaft |
| `src/village/buildings.ts` | Gebäudedefinitionen: Kosten, Stufengrenze, Tagesertrag, Arbeitsplätze |
| `src/village/economy.ts` | Reine Regeln: Kostenstufen, Kapazitäten, Tagesertrag, Löhne, Zuzug |
| `src/village/loot.ts` | Beute als Ableitung des Auftragsergebnisses, ohne Contract-Feld |
| `src/village/treasury.ts` | Einziger Owner von Ressourcen, Gebäuden, Arbeitern, Bauplätzen und offener Beute |
| `src/village/building-outlook.ts` | Gebäude-Ableitung: Stufe, Ertrag, Arbeitsplätze, Kosten, Fehlbetrag |
| `src/village/index.ts` | Barrel der village-Domäne |
| `src/raid/fixture-raid.ts` | Contract-v3-Upload und lokaler Fixture-Auftrag |
| `src/raid/raid-panel.tsx` | Probelauf-Panel, reicht den terminalen Auftrag an die Schleife weiter |
| `src/raid/panel.tsx` | Reine Ergebnis-Darstellung eines TerminalRaidJob und `raidOutcomeText` |
| `test/dungeon-editor.test.ts` | State-/Model-Tests der Editor-Logik |
| `test/village-phase.test.ts` | Phase-Übergänge, Skip-Verbot und Store-Verhalten |
| `test/day-night-loop.test.ts` | End-to-End-Loop mit Fake-Timern unter 5 s |
| `test/raid-job.test.ts` | Upload-Gültigkeit, Hash und Auftragszustände |
| `test/visual-foundation.test.ts` | Tests für World-Definitionen, Kamera, Depth, Observer |
| `test/render-animation.test.ts` | Periodik, Determinismus, Grenzen und Amplituden der Render-Animation |
| `test/input-drag.test.ts` | Slop-Verhalten: ein Down ohne Weg erzeugt keinen Drop |
| `test/village-settlement.test.ts` | Dorf-Ableitung gegen Wirtschaft, echten Loop-Zustand und Auftragsstatus |
| `test/village-economy.test.ts` | Bauen, Ablehnungen, Arbeiter, Tagesabrechnung und Beuteverkauf |
| `test/stage-view.test.ts` | Blickwechsel verändert die Spielphase nicht |
| `docs/*` | Pflicht-Doku dieser Domäne |

Der Client hat wieder einen Einstiegspunkt. `world`, `visual`, `render`, `input`,
`window` und `showcase` bilden die sichtbare visuelle Basis; `dungeon-editor`
bleibt der einzige Grid-Owner. `village` besitzt die Tag/Nacht/Raid-Phase und
leitet daraus den Dorfblick ab, `raid` rechnet den Fixture-Auftrag lokal. Die
Shell ist nur noch Layout; Topbar, Bühne und Sidebar lesen ihre Stores selbst.
`ui/view.ts` hält den Blick auf die Bühne, der bewusst keine Phase ist.
