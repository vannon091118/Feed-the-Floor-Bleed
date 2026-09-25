# packages/sim-core/docs/FUNKTIONSGRAPH.md

```text
prng:createRng ──▶ combat:actions (Seed-Varianz pro Angriff)
prng:deriveSeed ─▶ combat:actions (Sub-Stream je Tick/Ziel)
math:fixed ──────▶ combat:state (Schaden), combat:rules (Provisionals)
math:isqrt ──────▶ public sqrtFixed
hash:fnv1a ──────▶ combat:fingerprint ──▶ CombatLog.hash
grid:findPath ───▶ combat:resolve (Routenlänge) ──▶ combat:simulate
combat:simulate ─▶ combat:state (Zielwahl, Stage) + combat:actions (move/attack)
combat:replay ───▶ combat:simulate ──▶ Hash-Vergleich gegen gespeicherten Log
```

`sim-core` hat keine Kante zu `client`, `server`, `fs` oder Zeit. Combat liest
nur Grid, Math, PRNG und Hash; umgekehrt kennt keines dieser Module Combat.
