# packages/sim-core/docs/historisch/2026-09-27_changelog-rasterexport-und-stufenpruefung.md

Der Block „Ungenutzter Rasterexport entfernt, Stufenprüfung verkürzt" vom 2026-09-27 aus `packages/sim-core/docs/CHANGELOG.md`, ausgelagert am 2026-09-29, weil die Datei an ihre Zeilengrenze stiess. Unveraendert erhalten; die aktive Fassung steht unter `packages/sim-core/docs/CHANGELOG.md`.

## 2026-09-27 — Ungenutzter Rasterexport entfernt, Stufenprüfung verkürzt

**Scope:** geändert `src/grid/grid.ts` und `src/combat/state.ts`. Contracts, Hashes und Simulationsverhalten unberührt.

`gridSize()` in `src/grid/grid.ts` hatte keinen Aufrufer; der Export ist entfernt. In `src/combat/state.ts` ist `!boss || !boss.alive` zu `!boss?.alive` geworden — dieselbe Aussage, weil ein fehlender Boss kurzschließt und der zweite Vergleich dann ohnehin wahr ist. Anlass war die Umstellung von `pnpm run -s lint` auf `biome check --error-on-warnings` und der jetzt vollständige Typecheck der Testverzeichnisse, die beide Symbole vorher nicht sahen.
