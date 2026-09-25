# packages/client/docs/ARCHITEKTUR.md

## Rolle

PWA-Client: Rendern, Editieren lokal, Sync via `net`, Speichern via `storage`.
Aktueller Stand ist die Fixture-Shell T1.1 ohne Serververbindung.

## Struktur

- `src/fixture-data.ts` — read-only Startdaten (Dorf, Ressourcen, Team). Kein State, kein UI, keine Seiteneffekte.
- `src/dungeon-editor/model.ts` — pure Editor-Regeln: Pinsel → `CellType`, 4x4-Tile-Mapping, sichtbare Routen-Tiles. Kein Preact, keine Signals.
- `src/dungeon-editor/state.ts` — einziger Owner von `grid` und `brush` plus `computed` Route. Exportiert nur Commands (`resetGrid`, `selectBrush`, `paintVisibleTile`).
- `src/dungeon-editor/editor.tsx` — Rendering und lokaler Drag-State `painting`. Liest Grid/Route, schreibt ausschließlich über die State-Commands.
- `src/village/village-panel.tsx` — reine Props-Präsentation ohne globale Datenzugriffe.
- `src/ui/shell.tsx` — besitzt die Tagesphase lokal, komponiert Shell und Panels und reicht Fixture-Daten als Props nach unten.
- `src/ui/styles.css` — Theme, Layout, responsive Regeln.
- `src/main.tsx` — Mount auf `#app`.

## Datenfluss

```
fixture-data.ts ──Props──▶ ui/shell.tsx ──Props──▶ village/village-panel.tsx
                                  │
                                  └──Props──▶ dungeon-editor/editor.tsx
                                                     │ Commands
                                                     ▼
                                      dungeon-editor/state.ts (Owner)
                                                     │ pure Aufrufe
                                                     ▼
                                      dungeon-editor/model.ts
                                                     │
                                                     ▼
                                            @floor/sim-core (Grid/A*)
```

`state.route` ist aus `grid` abgeleitet und wird nicht separat gehalten. Die Shell
kennt nur die Tagesphase; der Editor-State kennt kein UI und keine Fixture-Daten.
`sim-core` bleibt der einzige Owner der Grid-/Pfadregeln, der Client dupliziert
keine Zell- oder Pfadlogik.

## Regeln

Kein direkter Grid-Mutate außerhalb von `dungeon-editor`. `net` macht kein
Game-State. Panels bekommen Daten als Props, statt globale Fixture-Werte zu lesen.
