# docs/FUNKTIONSGRAPH.md — Global

```
contracts:ZodSchema → sim-core:prng/math/grid/combat/genome/items/hash/ghost
sim-core:prng → sim-core:math/grid/combat/genome/ghost
sim-core:grid → sim-core:combat (Breitensuche als Route) + server:sync (Snapshot RLE+deflate)
sim-core:grid:serialize → sim-core:combat:fixture-job (Upload → DungeonGrid)
sim-core:combat:resolve → sim-core:combat:simulate (trail → fingerprint) → sim-core:hash (Kampf-Hash inkl. Trail)
sim-core:combat:resolve-snapshot → contracts:ResultPayload + contracts:RaidLogPayload (inkl. trail)
sim-core:combat:fixture-job → contracts:RaidJob (validierter Auftrag, kein I/O)
contracts:RaidJobSchema + RAID_JOB_TRANSITIONS → server:db:job-state → server:db:raid-store
client:raid:fixture-raid → sim-core:runFixtureRaid → client:ui:panels (Anzeige)
client:world → client:visual + client:render + client:dungeon-editor (Definitionen)
client:dungeon-editor:state → client:visual:observer → client:render (Deskriptoren, ohne Pixi)
client:render:camera → client:input:hit-test + client:showcase:controls (einzige World-Screen-Transformation)
client:ui:world-host → client:render:runtime (eine Pixi-Runtime) → client:ui:scene-switch
client:ui:scene-switch → client:render:village-view | client:showcase:scene (je eine lebende Szene)
client:ui:world-host → client:raid:playback (Replay-Takt am Runtime-Ticker, szenenunabhängig)
client:raid:combat-source → sim-core:resolveSnapshotRaid → client:raid:playback (echter Core-Log, ein Besitzer)
client:showcase:scene → client:render:route (Marker aus route.path, keine zweite Positionsquelle)
client:visual:combat-frame → client:render:fx (stabiler Event-Seed → gepoolte Partikel)
client:render:tile-atlas → Pixi-Texturen (deterministische Materialien, Fake-3D-Wände)
client:visual:route-index → actor-frame/event-fx/route-actors (gemeinsame Route-Index-Abbildung)
client:visual:variant → actor-frame/route-actors (gemeinsame Actor-Variante)
client:input:drag → Drop-Command (keine Spielregel im Command)
client:input:arrows → client:window:keys + client:render:camera-keys (eine Richtungstabelle je Schrittweite des Aufrufers)
client:window ↔ client:ui (Kontextfenster über der Pixi-Szene)
sim-core:genome → sim-core:items (Stein-Tier) + client:raid (Tactic-Board)
client:storage ↔ client:dungeon-editor/village (lokal)
client:net → server:sync/matchmaking (Upload/Results sequenziell)
server:db ↔ server:sync/matchmaking (Defender-State, Pool, Sperren)
worker:fetch → GET /api/health (Bindings-Status, keine DB-Abfrage)
worker:fetch → POST /api/sync/checkpoint → server:db:raid-store.checkpoint → D1 (201 neu, 200 idempotent)
worker:fetch → GET /api/sync/job/:id → server:db:raid-store.getJob → D1
Assets (Wurzel + /assets/*) → Cloudflare-Asset-Kante, umgeht den Worker vollständig
wrangler.jsonc → main: server/src/worker.ts + assets: client/dist + run_worker_first /api/* → workers.dev; observability.logs zeichnet die Worker-Logs auf
scripts/shinon:engine → plugins/* → git hooks (pre-commit/commit-msg/pre-push)
.github/workflows/shinon.yml → pnpm install --frozen-lockfile + pnpm run check → Shinon Gate bei main-Push und Pull Request; bei grünem PR-Gate promotet der Job promote den Kopf per Fast-Forward mit PROMOTE_TOKEN nach main, worauf der push-Zweig client-dist erzeugt (GITHUB_TOKEN würde ihn nicht auslösen)
.github/workflows/main-watchdog.yml → workflow_run(Shinon, completed) + conclusion != success → checkout(main) + gh api (Lauf und Jobs) → scripts/watchdog-classify.mjs → Vorfall oder kein Vorfall → offener Issue (Label watchdog für roten main-Push, promote-blocked für gescheiterten promote auf einem PR) + roter Lauf; schweigt bei rotem Gate und Feature-Branch-Pushes
workflow Shinon Gate → pnpm --filter @floor/client build → wrangler deploy --dry-run (unbedingt, auch im PR; kein Deploy, kein Secret)
push auf main → App cloudflare-workers-and-pages → Build command (pnpm install + Client-Build) → npx wrangler deploy → Check Workers Builds: feed-the-floor-bleed
.github/agents/critical-adversarial-reviewer → Git-Status/Diffs + Agents.md/Regelwerke + betroffene Dokus/Tests → verifizierte Befunde (schreibgeschützt)
.github/agents/berater → Code/Diff/Gate-Ausgabe + Agents.md → Urteil + Beleg + Fix, kurz (schreibgeschützt)
```

- `sim-core` hat keine Kante zu `client`/`server` oder `fs`/`Date`. Zeit kommt als Parameter, nicht aus einer Uhr.
- `contracts` hat keine Kante zu Logik — nur Typen/Schemas.
