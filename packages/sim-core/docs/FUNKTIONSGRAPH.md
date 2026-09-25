# packages/sim-core/docs/FUNKTIONSGRAPH.md

```text
prng:createRng ──▶ combat:actions (Seed-Varianz pro Angriff)
prng:deriveSeed ─▶ combat:actions (Sub-Stream je Tick/Ziel)
math:fixed ──────▶ combat:state (Schaden), combat:rules (Provisionals)
math:isqrt ──────▶ public sqrtFixed
hash:fnv1a ──────▶ combat:fingerprint ──▶ CombatLog.hash
grid:serialize ───▶ combat:fixture-job (Upload → DungeonGrid)
grid:findPath ───▶ combat:resolve (Routenlänge) ──▶ combat:simulate
combat:simulate ─▶ combat:state (Zielwahl, Stage) + combat:actions (move/attack)
combat:summary ───▶ combat:resolve-snapshot (ResultPayload)
combat:resolve-snapshot ──▶ combat:fixture-job (RaidJob)
combat:replay ───▶ combat:simulate ──▶ Hash-Prüfung in combat:fixture-job
contracts:RaidJobSchema ─▶ combat:fixture-job (Rückgabevalidierung)
```

`sim-core` hat keine Kante zu `client`, `server`, `fs` oder Zeit. Combat liest
nur Grid, Math, PRNG, Hash und `@floor/contracts`; umgekehrt kennt keines dieser
Module Combat. `fixture-job` ist die einzige Stelle, die einen Auftrag als Ganzes
betrachtet.
