# packages/sim-core/docs/ARCHITEKTUR.md

## Rolle

Deterministischer, I/O-freier Core. Alle Simulation rein über PRNG-Seed, Fixed-Point, feste Tick-Rate.

## Module

- `prng` Mulberry32 + `derive(seed, index)` via Hash
- `math` Fixed-Point (int), int-sqrt, kein Float
- `grid` 64x64, RLE+deflate, A* mit Nachbar-Reihenfolge als Tie-Break
- `combat` Auto-Battler, 20 Ticks/s, 90s Limit, Tactic-Eval deterministisch
- `genome` Zucht intra-Cluster, Kind = Mittel × Mutation(Seed), Trait-Dominanz
- `items` Loot (1-4 Mutatoren), Essenzen, Steine (5/Boss, Tier ≤ f(Gen,Score))
- `hash` Snapshot/Kampf-Hash für Replay-Validierung
- `ghost` Deterministischer Dungeon-Generator aus Seed+Stärkeband

## Regeln

Kein `Math.random`, `Date`, `Math.sin/pow/sqrt`, keine Float-Division ohne Fixed-Point. Golden-Replay in 3 Browsern.
