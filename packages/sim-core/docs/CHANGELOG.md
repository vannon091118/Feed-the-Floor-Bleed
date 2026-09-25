# packages/sim-core/docs/CHANGELOG.md

## 2026-09-25 — Fallback-Ordering korrigiert

- Der Fallback-Suchpfad optimiert jetzt Minimalkosten statt Minimalschritte; Steps-First bleibt nur für das Budget-Limit-Search erhalten.
- Golden-Test verankert: Trap-Route mit 131 Kosten vs. Umweg-Loop mit 127 Kosten — der Fallback wählt die günstige Route.

## 2026-09-25 — Erster Dungeon-Core

- 64×64-Logikgrid mit fünf Tile-Typen, Spawn/Boss und 4×4-Logikzellen pro sichtbarem Tile in einer 16×16-Tile-Aufteilung implementiert.
- Deterministische A*-Routensuche mit Trap-Kosten, +5-Bewegungsbudget, Fallback durch Fallen und Hard-Block implementiert.
- Sieben Golden-Tests für Routing, Budget, Fallback, Unerreichbarkeit und Grid-Validierung ergänzt.

## 2026-09-25 — Init

- Domäne angelegt: `src/prng`, `src/math`, `src/grid`, `src/combat`, `src/genome`, `src/items`, `src/hash`, `src/ghost`.
- Hygiene-Skelett erfüllt. Determinismus-Regeln aktiv (kein Math.random/Date/sin/pow/sqrt).
