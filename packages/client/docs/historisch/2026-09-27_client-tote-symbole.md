# packages/client/docs/historisch/2026-09-27_client-tote-symbole.md — Tote Symbole entfernt und die Tests in den Typecheck geholt

Wortgleich aus `packages/client/docs/CHANGELOG.md` verschoben am 2026-09-29, weil der aktive Changelog den 200-Zeilen-Cap erreicht hatte. Append-only.

## 2026-09-27 — Tote Symbole entfernt und die Tests in den Typecheck geholt

**Der Befund war eine Lücke im Programm, nicht im Code.** `tsconfig.json` listete `packages/*/test/**/*` nicht, deshalb sah `tsc` nur die neun `*.test.ts` unter `src/` und keine einzige der Testdateien in den `test/`-Verzeichnissen. Das `dead-code-gate` lief mit demselben `include` und meldete trotzdem „NoUnused geprüft". Erst als das Programm die Tests enthielt, wurden zwölf echte Typfehler sichtbar — unter anderem fehlende Pflichtfelder in `test/raid-fixtures.ts` und drei `stepPlayback`-Aufrufe mit zwei Argumenten — und mit ihnen vier Importe, die seit dem Umbau niemand mehr benutzte.

**Was entfallen ist.** `render/dungeon-views.ts` war eine sechszeilige Re-Export-Fassade ohne Importeur; sie ist gelöscht. `render/modes.ts` führt nur noch `RenderMode` und `DungeonRenderMode`, die beide typseitig gebraucht werden. `gridSize` in `sim-core/src/grid/grid.ts` und `sectionsOf` in `raid/playback.ts` hatten keinen Aufrufer. In `render/depth.ts` ist die ungenutzte Vergleichsfunktion `actorTie` weg; `depthValue` bleibt die einzige Sortierquelle.

**In den Tests.** Die sechs Client-Testdateien sind jetzt Teil des Programms; die vier toten Symbole (`event`, `TerminalRaidJob`, `type Phase`, `combatFrame`) und die daraus folgenden Typfehler sind bereinigt, `test/raid-fixtures.ts` erzeugt gültige Contract-v3-Envelopes. `docs/REPOINDEX.md` führt die gelöschte Fassade nicht mehr.

**Gates:** typecheck 0, Lint 0 (`biome check --error-on-warnings`), 238 Tests in 39 Dateien grün, LOC-Caps ok, Hygiene ok, Shinon PASS.
