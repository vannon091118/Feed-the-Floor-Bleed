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
combat:boss ──────▶ combat:rules (Boss-Spec) + combat:state (Stage) + combat:summary (bossAlive)
combat:summary ───▶ combat:resolve-snapshot (ResultPayload)
combat:resolve-snapshot ──▶ combat:fixture-job (RaidJob)
combat:replay ───▶ combat:simulate ──▶ Hash-Prüfung in combat:fixture-job
contracts:RaidJobSchema ─▶ combat:fixture-job (Rückgabevalidierung)
roster-a + roster-b ───▶ genome:registry (Pool, Invarianten beim Laden)
genome:registry ───────▶ genome:baseGenome + genome:stats (Basisart, Elemente)
genome:mutation ───────▶ genome:baseGenome, genetisches Element + PRNG
genome:stats ──────────▶ genome:resolve (Kopplung der Elemente zu Basiswerten)
genome:effects ────────▶ genome:resolve (Traits und Boni, Reihenfolge)
genome:resolve ────────▶ öffentliche Kampfwerte eines Genoms
prng + hash ───────────▶ genome:mutation (einzige Zufallsquelle der Zucht)
```

`sim-core` hat keine Kante zu `client`, `server`, `fs` oder Zeit. `fixture-job`
ist die einzige Stelle, die einen Auftrag als Ganzes betrachtet.

`combat` liest die Art des Verteidigers aus `genome/stats` und die Basiswerte
aus `src/units.ts`; die Kante läuft in eine Richtung. `genome` liest selbst nur
`math`, `prng`, `hash` und `units` und rechnet keine Kämpfe. `src/units.ts`
gehört keiner der beiden Domänen an und trägt genau diese eine Wahrheit, damit
die Kante keine Schleife schließen kann.
