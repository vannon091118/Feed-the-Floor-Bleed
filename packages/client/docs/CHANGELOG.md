# packages/client/docs/CHANGELOG.md

## 2026-09-25 — Drei Review-Findings behoben: Kamera, Drag-Slop, Raid-Panel

- `src/render/runtime.ts` rechnete die World-to-Screen-Matrix ein zweites Mal. `applyCamera` holt den Container-Ursprung jetzt über `worldToScreen` aus `camera.ts`; die Regel „genau eine Transformation" ist damit im Code und nicht nur in der Doku gültig.
- `src/input/drag.ts` aktivierte den Drag bei jedem Pointer-Down. Dadurch war jeder Klick auf einen Actor gleichzeitig ein Drop, und der Klickpfad zum Kontextfenster lief nie. Ein Down registriert jetzt nur noch einen Kandidaten; erst eine Bewegung über den Slop macht daraus einen aktiven Zug.
- `src/input/drag-target.ts` neu: `resolveTarget`, `passedSlop`, `advance` und `dropCommand` kapseln Trefferauflösung und Zwischenzustand. Der Slop-Zusatz hatte `drag.ts` über den `input`-Cap von 100 Code-Zeilen getrieben, deshalb der Schnitt entlang der zwei Jobs.
- `src/showcase/controls.ts` entscheidet die Geste erst nach dem Slop: auf einem Actor ein Drag, sonst ein Pan, ohne Weg ein Klick.
- `src/ui/shell.tsx` rendert `src/raid/raid-panel.tsx` wieder, das in der Repository-Historie lag, aber von keiner gerenderten Komponente erreicht wurde. Ohne diese Einbindung war der lokale bestimmbare Fixture-Raid im Browser nicht mehr auslösbar.
- `src/ui/styles.css` ergänzt die Klassen des Raid-Panels aus den vorhandenen Tokens.
- `test/input-drag.test.ts` neu: belegt, dass ein Down ohne Weg keinen Drop erzeugt, dass der Zug erst nach dem Slop aktiv wird und dass außerhalb des Greifradius kein Kandidat entsteht. Die Drag-Tests sind aus `test/visual-foundation.test.ts` herausgezogen, weil diese Datei sonst den globalen 200-Zeilen-Cap gerissen hätte.

## 2026-09-25 — Visuelle Foundation: Pixi-Szene, World, Observer, Window-Runtime

- `packages/client/package.json` und `pnpm-lock.yaml`: `pixi.js@^8` als Client-Abhängigkeit. Die seit dem Init dokumentierte PixiJS-8-Schicht ist damit tatsächlich vorhanden; `docs/ARCHITEKTUR.md` behauptete sie vorher ohne Deckung.
- `src/world/*` neu: `geometry.ts`, `materials.ts`, `tiles.ts`, `descriptors.ts` und Barrel als einzige Tile-/Material-/Deskriptor-Wahrheit. `CellType`, `GRID_SIZE`, `VISIBLE_TILE_SIZE` und `LOGIC_CELLS_PER_VISIBLE_TILE` werden aus `sim-core` wiederverwendet und nicht neu erfunden.
- `src/render/*` neu: `camera.ts` hält die einzige `worldToScreen`/`screenToWorld`-Implementierung, `runtime.ts` besitzt `Application`, Ebenen und Ticker, `terrain.ts`, `actors.ts`, `fx.ts` und `lighting.ts` sind persistente Views, `atlas.ts` erzeugt Texturen prozedural und deterministisch, `filters.ts` leitet Materialfilter aus Materialparametern ab. FX läuft über einen festen Pool ohne Allokation pro Treffer.
- `src/visual/*` neu: `observer.ts`, `terrain.ts` und `combat-frame.ts` übersetzen Grid, Route und Combat-Log in Präsentationsdeskriptoren. Bewusst ohne Pixi-Import, damit die Logik testbar bleibt und der Core nichts über Rendering weiß.
- `src/input/*` neu: einheitlicher Pointer-Pfad für Maus und Touch, Hit-Test über die Kamera, Drag-Schicht, die beim Abschluss nur einen Command emittiert.
- `src/window/*` neu: Preact-Fenster-Registry mit Fokus, Z-Order, Drag und Resize.
- `src/showcase/*` neu: Treiber, Viewport-Steuerung und Combat-Quelle, die die sichtbare Referenzszene aus echten Grid-, Route- und Core-Log-Daten bauen. Combat-Positionen entstehen aus `routeIndex`/`fromIndex`/`toIndex`, abgebildet auf `route.value.path`.
- `src/ui/*` neu: `shell.tsx`, `world-host.tsx`, `editor-panel.tsx`, `editor-controls.tsx`, `panels.tsx` und `styles.css`. Der Editor bleibt DOM, die laufende Welt rendert Pixi; Fenster liegen als Preact-DOM über der Szene. `src/main.tsx` existiert wieder, der Client startet.
- `test/visual-foundation.test.ts` neu: prüft Weltdefinitionen, Geometrie, Kamera-Umkehrbarkeit, Depth-Ordnung, Terrain-Diff und die Route-Abbildung des Combat-Frames.
- `docs/ARCHITEKTUR.md`, `FUNKTIONSGRAPH.md`, `REPOINDEX.md` und `STRINGMATRIX.md` beschreiben die neue Schicht. Der Stringmatrix-Eintrag `raid/trail` hält den offenen Trail-Hash fest.

## 2026-09-25 — Visuelle Schicht entfernt

- Sieben Dateien gelöscht: `src/main.tsx`, `src/ui/shell.tsx`, `src/ui/styles.css`, `src/village/village-panel.tsx`, `src/raid/raid-panel.tsx`, `src/raid/team-panel.tsx` und `src/dungeon-editor/editor.tsx`. Der Client hat damit keinen Einstiegspunkt und rendert nichts.
- Der Grund war eine Bilanz der visuellen Schicht: keine der beiden im CSS genannten Schriften wurde tatsächlich geladen, zwei Texte lagen unter dem WCAG-AA-Kontrast, alle acht Buttons waren 42 Pixel hoch statt 44, es gab zwölf freie Schriftgrößen ohne Skala, keine Transitions mit Dauer und 388 Pixel tote Fläche unter der Seitenspalte.
- `model.ts` und `state.ts` bleiben erhalten, weil sie Logik sind und kein Markup. `fixture-data.ts` und `raid/fixture-raid.ts` bleiben ebenfalls, damit der T1.3-Auftragsweg testbar steht.
- `model.ts` hat vor dem Löschen `tileMarker` bekommen: Der Boss lag auf Logikzelle 63,63, der Editor prüfte aber nur die erste Zelle eines Tiles, also 60,60 bei Tile 15,15. Der Boss war dadurch im Grid vorhanden, aber im Renderer unsichtbar. Die Logik überlebt das Löschen und ist getestet.
- `model.ts` bleibt architektonisch fehlplatziert: `paintTile` enthält das 4x4-Logikraster und den Spawn- und Boss-Schutz, `tileMarker` die Tile-zu-Logikzelle-Abimmung. Beides gehört nach `sim-core/src/grid`, der Server kann die Regel heute nicht nutzen.
- Verweise in `REPOINDEX.md`, `ARCHITEKTUR.md`, `FUNKTIONSGRAPH.md` und `STRINGMATRIX.md` auf die entfernten Komponenten bereinigt. Die Lücke `ui/phase` und `ui/tabs` ist in der Stringmatrix als entfernt vermerkt.
- Typecheck und alle 104 Tests bleiben grün: die Client-Tests prüfen Logik, nicht Markup.

## 2026-09-25 — T1.3 lokaler Fixture-Raid

- `src/raid/fixture-raid.ts` neu: `buildFixtureUpload` baut aus dem Editor-Grid und den Fixture-Daten einen gültigen Contract-v2-Upload, `runLocalFixtureRaid` führt ihn lokal ohne Netz aus.
- `src/raid/raid-panel.tsx` neu: zeigt Ergebnisstufe, Hash, Ticks, Ereignisse, Angriffe und Überlebende sowie Fehler- und Timeout-Zustände. Der Lauf startet über einen eigenen Knopf.
- `src/raid/team-panel.tsx` neu: Teamanzeige und Auswahlknopf als reine Props-Komponente aus `ui/shell.tsx` herausgelöst, damit die Shell unter ihrem LOC-Cap bleibt.
- `src/fixture-data.ts`: Helden tragen `id`, `fatigue` und `tactics`; das Verteidiger-Roster und feste Auftragsdaten (Job-ID, Seed, Etage, Zeiten) liegen dort. Die Zeiten sind Konstanten, damit der Probelauf reproduzierbar bleibt.
- `src/ui/shell.tsx`: Nachtphase rendert `RaidPanel` unter dem Editor; Hinweistext und Footer auf T1.3 gehoben.
- `src/ui/styles.css`: Styles für Ergebniszeile, Kennzahlen-Raster und Idle-/Hinweistext inklusive Mobile-Breakpoint.
- `test/raid-job.test.ts` neu: Upload-Gültigkeit, reproduzierbarer Hash, Hash-Änderung bei längerer Route, blockierte Route und ein Test, der die bekannte Routenlängen-Lücke pinnt.
- Der Panel ist als Probelauf beschriftet. Der Client entscheidet nichts — er zeigt das Ergebnis eines Core-Laufs.

## 2026-09-25 — Architektur-Pass Fixture-Shell

- `src/ui/fixture.ts` aufgelöst. State nach `src/dungeon-editor/state.ts`, pure
  Regeln nach `src/dungeon-editor/model.ts`, read-only Daten nach
  `src/fixture-data.ts` verschoben.
- `src/ui/shell.tsx` besitzt die Tagesphase jetzt lokal und reicht Fixture-Daten
  als Props an `EditorPanel` und `VillagePanel`; keine Panel liest globale
  Fixture-Werte.
- `src/dungeon-editor/editor.tsx` rendert nur noch, lokaler Drag-State bleibt in
  der Komponente, Grid-/Pinsel-Schreibzugriffe laufen über State-Commands.
- `src/village/village-panel.tsx` ist eine reine Props-Komponente.
- Externer Google-Fonts-`@import` aus `src/ui/styles.css` entfernt (Hardcode-Regel);
  Font-Stacks fallen auf System-Fonts zurück.
- Tests von `test/fixture.test.ts` nach `test/dungeon-editor.test.ts` verschoben
  und um Model-Grenzfälle ergänzt.

## 2026-09-25 — Init

- Domäne angelegt: `dungeon-editor`, `village`, `inventory`, `raid`, `net`, `storage`, `ui`.
- PWA-Ziel: Vite + PixiJS 8 + Preact + Signals + Dexie + fflate. Tab/ Sidebar Layout.
