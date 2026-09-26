# docs/FUNKTIONSGRAPH.md — Global

```
contracts:ZodSchema → sim-core:prng/math/grid/combat/genome/items/hash/ghost
sim-core:prng → sim-core:math/grid/combat/genome/ghost
sim-core:grid → sim-core:combat (A* Pfad) + server:sync (Snapshot RLE+deflate)
sim-core:grid:serialize → sim-core:combat:fixture-job (Upload → DungeonGrid)
sim-core:combat:resolve → sim-core:combat:simulate (trail → fingerprint) → sim-core:hash (Kampf-Hash inkl. Trail) → server:sync (Replay-Validierung)
sim-core:combat:resolve-snapshot → contracts:ResultPayload + contracts:RaidLogPayload (inkl. trail)
sim-core:combat:fixture-job → contracts:RaidJob (validierter Auftrag, kein I/O)
contracts:RaidJobSchema + RAID_JOB_TRANSITIONS → server:db:job-state → server:db:raid-store
client:raid:fixture-raid → sim-core:runFixtureRaid → client:ui:panels (Anzeige)
client:world → client:visual + client:render + client:dungeon-editor (Definitionen)
client:dungeon-editor:state → client:visual:observer → client:render (Deskriptoren, ohne Pixi)
client:render:camera → client:input:hit-test + client:showcase:controls (einzige World-Screen-Transformation)
client:showcase:combat-source → sim-core:resolveSnapshotRaid → client:render (echter Core-Log)
client:showcase:scene → client:render:route (Marker aus route.path, keine zweite Positionsquelle)
client:visual:combat-frame → client:render:fx (stabiler Event-Seed → gepoolte Partikel)
client:render:tile-atlas → Pixi-Texturen (deterministische Materialien, Fake-3D-Wände)
client:visual:route-index → actor-frame/event-fx/route-actors (gemeinsame Route-Index-Abbildung)
client:visual:variant → actor-frame/route-actors (gemeinsame Actor-Variante)
client:input:drag → Drop-Command (keine Spielregel im Command)
client:window ↔ client:ui (Kontextfenster über der Pixi-Szene)
sim-core:genome → sim-core:items (Stein-Tier) + client:raid (Tactic-Board)
client:storage ↔ client:dungeon-editor/village (lokal)
client:net → server:sync/matchmaking (Upload/Results sequenziell)
server:db ↔ server:sync/matchmaking (Defender-State, Pool, Sperren)
scripts/shinon:engine → plugins/* → git hooks (pre-commit/commit-msg/pre-push)
.github/workflows/shinon.yml → pnpm install --frozen-lockfile + pnpm run check → Shinon Gate bei main-Push und Pull Request; bei grünem PR-Gate promotet der Job promote den Kopf per Fast-Forward nach main
.github/agents/critical-adversarial-reviewer → Git-Status/Diffs + Agents.md/Regelwerke + betroffene Dokus/Tests → verifizierte Befunde (schreibgeschützt)
.github/agents/berater → Code/Diff/Gate-Ausgabe + Agents.md → Urteil + Beleg + Fix, kurz (schreibgeschützt)
```

- `sim-core` hat keine Kante zu `client`/`server` oder `fs`/`Date`. Zeit kommt als Parameter, nicht aus einer Uhr.
- `contracts` hat keine Kante zu Logik — nur Typen/Schemas.
