# packages/client/docs/REPOINDEX.md

| Pfad | Job |
|------|-----|
| `index.html` | Vite-HTML-Entry mit `#app` |
| `vite.config.ts` | Vite + Preact-Plugin + `@floor/*`-Aliase |
| `src/main.tsx` | Mount der Shell auf `#app` |
| `src/fixture-data.ts` | Read-only Fixture-Daten (Dorf, Ressourcen, Team) |
| `src/dungeon-editor/model.ts` | Pure Editor-Regeln (Pinsel, 4x4-Tiles, Routen-Tiles) |
| `src/dungeon-editor/state.ts` | Einziger Owner von Grid, Pinsel und abgeleiteter Route |
| `src/dungeon-editor/editor.tsx` | Editor-Rendering und lokaler Drag-State |
| `src/village/village-panel.tsx` | Dorf-Panel als reine Props-Präsentation |
| `src/ui/shell.tsx` | Shell, besitzt Tagesphase, verteilt Fixture-Props |
| `src/ui/styles.css` | Theme, Layout, responsive Regeln |
| `test/dungeon-editor.test.ts` | State-/Model-Tests der Fixture-Shell |
| `docs/*` | Pflicht-Doku dieser Domäne |
