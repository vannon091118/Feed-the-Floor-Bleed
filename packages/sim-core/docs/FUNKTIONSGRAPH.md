# packages/sim-core/docs/FUNKTIONSGRAPH.md

```text
prng:createRng ──▶ combat:actions (Seed-Varianz pro Angriff)
prng:deriveSeed ─▶ combat:actions (Sub-Stream je Tick/Ziel)
math:fixed ──────▶ combat:state (Schaden), combat:rules (Provisionals)
math:isqrt ──────▶ public sqrtFixed
hash:fnv1a ──────▶ combat:fingerprint ──▶ CombatLog.hash
grid:serialize ───▶ combat:fixture-job (Upload → DungeonGrid)
grid:findPath ───▶ combat:resolve (Trail mit x/y/cell) ──▶ combat:simulate
grid:classifyDungeonZones ─▶ combat:resolve (Trail-Zone + Platzierungsgruppen) ─▶ combat:rules (ambushZoneId)
combat:simulate ─▶ combat:state (Zielwahl, Zone je Route-Index, Stage) + combat:actions (move/attack/ambush)
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
genome:behavior ───────▶ combat:rules (behaviorForTrait am Spec) ─▶ combat:state (chooseOpponent)
genome:behavior ───────▶ @floor/contracts (MONSTER_BEHAVIORS: eine Liste, ein Besitzer)
prng + hash ───────────▶ genome:mutation (einzige Zufallsquelle der Zucht)
```

`sim-core` hat keine Kante zu `client`, `server`, `fs` oder Zeit. `fixture-job`
ist die einzige Stelle, die einen Auftrag als Ganzes betrachtet.

`combat` rechnet ohne zweiten Ortskontext: die Zone einer Einheit ist
`trail[routeIndex].zoneId`, der Trail kommt aus `resolveCombat`. Deshalb bleibt
`replayCombat` auf dem Log allein lauffähig — die Kante `combat:replay`
`──▶ combat:simulate` trägt keinen Grid-Zugriff.

`combat` liest die Art des Verteidigers aus `genome/stats`, ihr Verhaltensprofil
aus `genome:behavior` und die Basiswerte
aus `src/units.ts`; die Kante läuft in eine Richtung. `genome` liest selbst nur `math`, `prng`, `hash` und `units` — plus seit dem
Verhaltens-Slice die Kanon-Liste `MONSTER_BEHAVIORS` aus `@floor/contracts`,
einer reinen Datenkante ohne Rechnung, die nur nach außen zeigt: der Contract
liest nie zurück. `genome` rechnet weiterhin keine Kämpfe. `src/units.ts`
gehört keiner der beiden Domänen an und trägt genau diese eine Wahrheit, damit
die Kante keine Schleife schließen kann.
