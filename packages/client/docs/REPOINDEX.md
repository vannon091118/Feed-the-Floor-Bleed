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
| `src/ui/shell.tsx` | Shell: Tag/Nacht, Welt, Fenster, Editor |
| `src/ui/world-host.tsx` | Stabiler DOM-Host und Lebenszyklus der Pixi-Runtime |
| `src/ui/editor-panel.tsx` | DOM-Editorraster mit 16×16 sichtbaren Feldern |
| `src/ui/editor-controls.tsx` | Pinselauswahl und Reset |
| `src/ui/panels.tsx` | Inhalte der Kontextfenster |
| `src/ui/styles.css` | Layout, Fensterchrome, Editorraster, Mobile |
| `src/dungeon-editor/model.ts` | Pure Editor-Regeln (Pinsel, 4x4-Tiles, Marker) |
| `src/dungeon-editor/state.ts` | Einziger Owner von Grid, Pinsel und Route |
| `src/raid/fixture-raid.ts` | Contract-v2-Upload und lokaler Fixture-Auftrag |
| `src/raid/raid-panel.tsx` | Fixture-Raid-Panel, fest in der Shell eingebunden |
| `test/dungeon-editor.test.ts` | State-/Model-Tests der Editor-Logik |
| `test/raid-job.test.ts` | Upload-Gültigkeit, Hash und Auftragszustände |
| `test/visual-foundation.test.ts` | Tests für World-Definitionen, Kamera, Depth, Observer |
| `test/render-animation.test.ts` | Periodik, Determinismus, Grenzen und Amplituden der Render-Animation |
| `test/input-drag.test.ts` | Slop-Verhalten: ein Down ohne Weg erzeugt keinen Drop |
| `docs/*` | Pflicht-Doku dieser Domäne |

Der Client hat wieder einen Einstiegspunkt. `world`, `visual`, `render`, `input`,
`window` und `showcase` bilden die sichtbare visuelle Basis; `dungeon-editor`
bleibt der einzige Grid-Owner.
