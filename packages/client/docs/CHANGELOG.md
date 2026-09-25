# packages/client/docs/CHANGELOG.md

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
