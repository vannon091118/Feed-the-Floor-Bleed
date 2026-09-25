# packages/client/docs/ARCHITEKTUR.md

## Rolle

PWA-Client: Rendern, Editieren lokal, Sync via `net`, Speichern via `storage`.
Aktueller Stand ist T1.3: Fixture-Shell plus lokal ausgeführter
Fixture-Raid. Keine Serververbindung.

## Struktur

- `src/fixture-data.ts` — read-only Startdaten (Dorf, Ressourcen, Team). Kein State, kein UI, keine Seiteneffekte.
- `src/dungeon-editor/model.ts` — pure Editor-Regeln: Pinsel → `CellType`, 4x4-Tile-Mapping, sichtbare Routen-Tiles. Kein Preact, keine Signals.
- `src/dungeon-editor/state.ts` — einziger Owner von `grid` und `brush` plus `computed` Route. Exportiert nur Commands (`resetGrid`, `selectBrush`, `paintVisibleTile`).
- `src/dungeon-editor/editor.tsx` — Rendering und lokaler Drag-State `painting`. Liest Grid/Route, schreibt ausschließlich über die State-Commands.
- `src/village/village-panel.tsx` — reine Props-Präsentation ohne globale Datenzugriffe.
- `src/raid/fixture-raid.ts` — baut den Contract-v2-Upload aus Editor-Grid und Fixture-Daten und startet den lokalen Auftrag im Core. Kein Net, keine Uhr, kein eigener Ergebnisentscheid.
- `src/raid/raid-panel.tsx` — zeigt Stufe, Hash und Kennzahlen sowie Fehler- und Timeout-Zustände. Der einzige State ist das zuletzt gerechnete Ergebnis.
- `src/raid/team-panel.tsx` — Teamanzeige und Auswahlknopf als reine Props-Komponente.
- `src/ui/shell.tsx` — besitzt die Tagesphase lokal, komponiert Shell und Panels und reicht Fixture-Daten als Props nach unten.
- `src/ui/styles.css` — Theme, Layout, responsive Regeln.
- `src/main.tsx` — Mount auf `#app`.

## Datenfluss

```
fixture-data.ts ──Props──▶ ui/shell.tsx ──Props──▶ village/village-panel.tsx
                                  │           └──Props──▶ raid/team-panel.tsx
                                  │
                                  ├──Props──▶ dungeon-editor/editor.tsx
                                  │              │ Commands
                                  │              ▼
                                  │   dungeon-editor/state.ts (Owner)
                                  │              │ pure Aufrufe
                                  │              ▼
                                  │   dungeon-editor/model.ts
                                  │              │
                                  │              ▼
                                  │     @floor/sim-core (Grid/A*)
                                  │
                                  └──▶ raid/raid-panel.tsx
                                            │ liest grid aus dem Editor-State
                                            ▼
                                     raid/fixture-raid.ts
                                            │
                                            ▼
                       @floor/sim-core runFixtureRaid + @floor/contracts RaidJob
```

`state.route` ist aus `grid` abgeleitet und wird nicht separat gehalten. Die Shell
kennt nur die Tagesphase; der Editor-State kennt kein UI und keine Fixture-Daten.
`sim-core` bleibt der einzige Owner der Grid-/Pfadregeln, der Client dupliziert
keine Zell- oder Pfadlogik. Dasselbe gilt für den Auftrag: `RaidPanel` rendert,
`fixture-raid` übersetzt, `runFixtureRaid` entscheidet. Der Client besitzt keine
eigene Kampf- oder Ergebnislogik.

## Regeln

Kein direkter Grid-Mutate außerhalb von `dungeon-editor`. `net` macht kein
Game-State. Panels bekommen Daten als Props, statt globale Fixture-Werte zu lesen.
`fixture-data.ts` bleibt read-only; der Auftrag wird daraus kopiert, nie
zurückgeschrieben. Der Probelauf liest keine Uhr — `createdAt`/`observedAt`
sind Konstanten, damit derselbe Grid denselben Hash ergibt.
