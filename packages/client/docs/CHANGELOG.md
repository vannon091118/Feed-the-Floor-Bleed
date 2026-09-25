# packages/client/docs/CHANGELOG.md

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
