# packages/client/docs/historisch/2026-09-25_client-aufbau.md

## 2026-09-25 — Visuelle Schicht entfernt

- Sieben UI-Dateien wurden zunächst entfernt, weil der damalige Entwurf keine geladene Schrift, unzureichenden Kontrast, uneinheitliche Schriftgrößen und tote Fläche aufwies. Die Visual-Foundation wurde danach modular neu aufgebaut.
- `model.ts` und `state.ts` blieben als Editorlogik bestehen. `tileMarker` korrigierte die Abbildung von Boss- und Spawn-Markern auf sichtbare Tiles.
- Tests für Editor-, Raid- und Visual-Logik blieben erhalten; Markup selbst war damals nicht abgedeckt.

## 2026-09-25 — T1.3 lokaler Fixture-Raid

- `src/raid/fixture-raid.ts` baut den Contract-Upload und führt den lokalen Auftrag ohne Netz aus.
- `src/raid/raid-panel.tsx` zeigt Ergebnis, Hash, Ticks, Ereignisse und Fehlerzustände.
- `src/fixture-data.ts` hält feste Fixture-Daten für reproduzierbare Tests.
- `test/raid-job.test.ts` prüft Upload, Hash, Blockade und Auftragszustände.

## 2026-09-25 — Init

- Domäne angelegt: `dungeon-editor`, `village`, `inventory`, `raid`, `net`, `storage`, `ui`.
- PWA-Ziel: Vite + PixiJS 8 + Preact + Signals + Dexie + fflate.
## 2026-09-25 — Visuelle Foundation: Pixi-Szene, World, Observer, Window-Runtime

- `packages/client/package.json` und `pnpm-lock.yaml`: `pixi.js@^8` als Client-Abhängigkeit.
- `src/world/*` neu: gemeinsame Geometrie, Materialien, Tiles und Deskriptoren auf Basis der Sim-Core-Konstanten.
- `src/render/*` neu: einzige Kamera-Transformation, Pixi-Runtime, persistente Terrain-/Actor-/FX-/Lighting-Views, deterministische Texturen und Materialfilter. FX läuft über einen festen Pool.
- `src/visual/*` neu: Observer, Terrain-Diff und Combat-Frame ohne Pixi-Import.
- `src/input/*` neu: gemeinsamer Pointer-Pfad, Hit-Test und Drag-Command.
- `src/window/*` neu: Preact-Fenster-Registry mit Fokus, Z-Order, Drag und Resize.
- `src/showcase/*` neu: Referenzszene aus echtem Grid, Route und Core-Log.
- `src/ui/*` neu: Shell, stabiler Pixi-Host, DOM-Editor und Fenster über der Szene.
- `test/visual-foundation.test.ts` prüft Weltdefinitionen, Kamera, Depth, Terrain-Diff und Route-Abbildung.
- `docs/ARCHITEKTUR.md`, `FUNKTIONSGRAPH.md`, `REPOINDEX.md` und `STRINGMATRIX.md` dokumentieren die Schichten.
