# packages/sim-core/docs/CHANGELOG.md

## 2026-09-25 — T1.2 deterministischer Combat-, Hash- und Replay-Core

- `math` implementiert Fixed-Point (Skala 1000) mit `mulFixed`, `divFixed`, `clampInt`, `absInt` sowie `isqrt`/`sqrtFixed` ohne `Math.sqrt`.
- `prng` implementiert Mulberry32 (`createRng`, `nextUint32`, `nextBelow`, `nextRange`) und `deriveSeed(seed, index, salt)` für Sub-Streams pro Aktion.
- `hash` implementiert eine FNV-1a-Kette über Wörter und Text als deterministischen Log-Fingerprint.
- `combat` implementiert die bounded Tick-Simulation mit deterministischer Zielwahl, Seed-Varianz pro Angriff, Event-Log, kanonischem Hash und Replay über `resolveCombat`, `simulateCombat`, `replayCombat` und `verifyCombatLog`.
- Balancing-Werte liegen provisorisch und zentral in `src/combat/rules.ts`; sie sind nicht abgenommen (`[K]` in `docs/CONCEPT_REVIEW.md`).
- 20 neue Tests decken Fixed-Point, PRNG, Hash, Determinismus, Seed-Sensitivität, Replay, Tick-Limit, Team-/Slot-Grenzen und den Hard-Block ohne Route ab.

## 2026-09-25 — Fallback zurück auf wenigste Tiles

- Der Fallback-Suchpfad optimiert wieder Minimalschritte (wenigste Tiles), nicht Minimalkosten; die frühere Umkehrung war nicht durch das ODT-Konzept gedeckt.
- `packages/sim-core/src/grid/path.ts` nutzt damit auch im Fallback `steps-first`.
- Golden-Test in `packages/sim-core/src/grid/path.test.ts` dreht die Erwartung: Bei Budget-Überschreitung wählt die Gruppe die Trap-Route mit 126 Steps / 131 Kosten statt des Umwegs mit 128 Steps / 127 Kosten.

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
