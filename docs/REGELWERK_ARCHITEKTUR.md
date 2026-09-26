# Regelwerk: Architektur und Ownership

Verbindlich für Änderungen an Architektur, Package-Grenzen und Quellcode-Struktur. `Agents.md` bleibt der Einstieg.

## Repository-Schnitt

```text
packages/
  contracts/   Zod-Schemas, Protokoll-Versionen, Owner-Contracts
  sim-core/    PRNG, Math, Grid/A*, Combat, Genome, Items, Hash, Ghost
  client/      World, Visual, Render, Input, Window, Showcase, UI und Spielfeatures
  server/      DB, Matchmaking und Sync
scripts/       Shinon-Gates, Installations- und Versionswerkzeuge
docs/          globale Pflichtdoku und Regelwerke
packages/*/docs/ Domänenpflichtdoku
docs/historisch/ append-only Historie
```

## Grenzen und Datenwahrheit

- Keine zirkulären Domain-Imports. `village` ändert keine Dungeon-Zellen; `raid-sim` macht kein I/O; `matchmaking` ändert keine Kampfergebnisse.
- `contracts` besitzt Wire-Schemas und Protokollversionen. `sim-core` besitzt reine Spielregeln und deterministische Simulation. Client rendert und emittiert Commands, entscheidet aber keine Kampfergebnisse. Server besitzt DB, Queues, Matching und Sync, nicht die Client-Darstellung.
- `world` besitzt Tile-, Material- und Deskriptor-Definitionen; `visual` übersetzt Zustand zu Präsentationsdeskriptoren ohne Pixi; `render` besitzt Pixi-Szene und Präsentationsanimation; `input` besitzt Pointer/Hit-Test/Drag und emittiert Commands; `window` besitzt Fensterzustand; `showcase` verbindet vorhandene Quellen, besitzt aber keinen Spielzustand.
- `dungeon-editor/state.ts` bleibt einziger Owner von Grid und Route. `grid` und `findPath`-Route sind die einzigen Positionsquellen.
- `worldToScreen` und `screenToWorld` existieren genau einmal in `packages/client/src/render/camera.ts`; Renderer, Hit-Test und Drag verwenden dieselbe Implementierung.
- Eine Datei = ein klarer Job. Keine God-Files und keine zweite Implementierung einer bestehenden Owner-Lösung. Vor neuen Patterns im Repo suchen.

## Modell-Ownership

| Owner | Besitzt | Darf nicht |
|-------|---------|------------|
| `village` | Gebäude, Attraktivität, Arbeiter | Dungeon-Zellen ändern |
| `dungeon` | Layout, Slots, Bau-Kapazität | Ressourcen buchen |
| `genome` | Zucht, Stats, Gen-Seed | Kämpfe rechnen |
| `items` | Items, Essenzen, Steine | Monster-Stats setzen |
| `raid-sim` | Kampf, Hash, Tactic-Eval | I/O, Zeit, externer Zufall |
| `matchmaking` | Pool, Zuweisung, Sperren | Kampfergebnisse ändern |
| `sync` | Upload/Results, Schutz, Log | Spielregeln enthalten |
| `world` | Tile-, Material- und Deskriptor-Definitionen | Grid-Zellen ändern, Spielregeln |
| `render` | Pixi-Szene, Kamera, Depth, Occlusion, FX, Filter | Spielzustand besitzen, Grid schreiben |
| `visual` | Visual Observer und Präsentationsdeskriptoren | zweite Grid-Wahrheit, Spielentscheid |
| `input` | Pointer, Hit-Test, Drag-Commands | Spielregeln im Drop |
| `window` | Fensterzustand, Fokus, Z-Order | Welt- oder Gridzustand |
| `showcase` | sichtbare Referenzszene | Core entscheiden, Grid schreiben |

## LOC-Kappen

Kommentare und Leerzeilen zählen nicht; geprüft wird mit `scripts/check-loc.mjs` und `scripts/shinon/policy.json`.

| Pfad / Ownership | Cap |
|------------------|-----|
| `packages/contracts/src` | 120 |
| `packages/sim-core/src/prng`, `hash` | 80 |
| `packages/sim-core/src/math` | 120 |
| `packages/sim-core/src/grid` | 150 |
| `packages/sim-core/src/combat`, `genome`, `items`, `ghost` | 150 |
| `packages/client/src/net`, `storage` | 100 |
| `packages/client/src/dungeon-editor`, `village`, `render`, `visual`, `showcase` | 150 |
| `packages/client/src/inventory`, `world`, `window` | 120 |
| `packages/client/src/input` | 100 |
| `packages/client/src/raid` | 150 |
| `packages/client/src/ui` | 120 |
| `packages/server/src/db` | 120 |
| `packages/server/src/matchmaking`, `sync` | 150 |
| `scripts/shinon` je Plugin | 150 |
| Shinon Engine | 200 |
| `scripts/bump-version.mjs` | 200 |

Der dynamische globale Datei-Cap kommt aus `policy.json` und gilt für Dateien unter `packages/` und `scripts/`. Es gibt kein Repository-Gesamtbudget. Aktive Pflichtdokus haben den separaten 200-Zeilen-Cap aus `docs/REGELWERK_DOKUMENTATION.md`.
