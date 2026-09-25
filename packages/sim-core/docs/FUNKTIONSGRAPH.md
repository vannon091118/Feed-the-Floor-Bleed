# packages/sim-core/docs/FUNKTIONSGRAPH.md

```
prng:mulberry32 → math:fixed → grid:aStar → combat:tick → hash:replay
prng → genome:breed (Mutation, Trait-Dominanz, Gen+1)
prng → items:roll (1-4 Mutatoren, visuell deterministisch)
prng → ghost:generate (Seed+Band → Snapshot)
grid:snapshot (RLE+deflate) → hash:snapshot
combat:sim + hash → server:sync Replay
```

`raid-sim` grenzt an `hash`, nie an I/O.
