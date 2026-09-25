# docs/FUNKTIONSGRAPH.md — Global

```
contracts:ZodSchema → sim-core:prng/math/grid/combat/genome/items/hash/ghost
sim-core:prng → sim-core:math/grid/combat/genome/ghost
sim-core:grid → sim-core:combat (A* Pfad) + server:sync (Snapshot RLE+deflate)
sim-core:combat → sim-core:hash (Kampf-Hash) → server:sync (Replay-Validierung)
sim-core:genome → sim-core:items (Stein-Tier) + client:raid (Tactic-Board)
client:storage ↔ client:dungeon-editor/village (lokal)
client:net → server:sync/matchmaking (Upload/Results sequenziell)
server:db ↔ server:sync/matchmaking (Defender-State, Pool, Sperren)
scripts/shinon:engine → plugins/* → git hooks (pre-commit/commit-msg/pre-push)
.github/workflows/shinon.yml → pnpm install --frozen-lockfile + pnpm run check → Shinon Gate bei jedem main-Push
```

- `sim-core` hat keine Kante zu `client`/`server` oder `fs`/`Date`.
- `contracts` hat keine Kante zu Logik — nur Typen/Schemas.
