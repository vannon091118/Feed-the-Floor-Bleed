# packages/sim-core/docs/REPOINDEX.md

| Pfad | Job |
|------|-----|
| `src/prng/` | Mulberry32, Seed-Ableitung |
| `src/math/` | Fixed-Point, isqrt |
| `src/hash/` | FNV-1a-Hash-Kette |
| `src/grid/` | Grid, Breitensuche ohne Zusatzkosten, Hard-Block, Contract-Serialisierung |
| `src/combat/` | Tick-Simulation, Events, Log-Hash, Replay, Summary, Fixture-Auftrag |
| `src/combat/boss.ts` | Boss-Identität, Boss-Ausgangswerte und boss-exklusive Verstärkungen |
| `src/combat/combat-pin.test.ts` | Golden-Pin des Kampf-Hashes: fester Seed, erwarteter Hash als Konstante |
| `src/combat/balance-report.test.ts` | Messwerkzeug: Stufenverteilung über Seeds und Verteidigerplätze |
| `src/genome/` | Registry, 20 Basis-Monster, Traits/Boni, gekoppelte Mutation und Züchtung |
| `src/genome/types.ts` | Genome-Datenvertrag: Basis-Monster, Genome, abgeleitete Werte, ID-Listen, Elementgrenzen |
| `src/genome/registry.ts` | Einziger Nachschlageort für ein Basis-Monster; prüft die Pool-Invarianten beim Laden |
| `src/genome/roster-a.ts`, `roster-b.ts` | Die zwanzig Basis-Monster, je zehn pro Datei; tragen den `[K]`-Vermerk |
| `src/genome/mutation.ts` | Zuchtkette: Vererbung, Kopplung, Drift; einzige Zufallsquelle ist der interne PRNG |
| `src/genome/stats.ts` | Ableitung der Kampfwerte aus den drei Elementen plus je Art abweichendem Bias |
| `src/genome/effect-kit.ts` | Gemeinsame Effektform und die Grenzen für Initiative und Cooldowns |
| `src/genome/effects.ts` | Bindung von Trait- und Bonus-ID an ihre Effektdatei; Ladefehler bei fehlender Logik |
| `src/genome/resolve.ts` | Feste Ableitungsreihenfolge: Kopplung, dann Traits, dann Boni |
| `src/genome/trait-*.ts`, `src/genome/bonus-*.ts` | Je eine Datei pro Trait und pro Bonus: reine Werteänderung |
| `src/genome/genome.test.ts`, `breeding.test.ts` | Registry-, Mutations- und Züchtungs-Invarianten |
| `src/items/` | offen: Items, Essenzen, Steine |
| `src/ghost/` | offen: Ghost-Generator |
| `docs/*` | Pflicht-Doku dieser Domäne |
