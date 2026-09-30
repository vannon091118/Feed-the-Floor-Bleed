# packages/sim-core/docs/CHANGELOG.md

## 2026-09-29 — Die Stärke eines Wesens, gemessen statt gesetzt

**Scope:** neu `src/genome/strength.ts` und `src/genome/strength.test.ts`. Geändert `src/genome/stats.ts` (Bias aus der Stärke statt aus dem Hash, `monsterStats` ohne `base`-Parameter), `src/genome/resolve.ts` (Aufruf), `src/genome/index.ts` (Exporte). **Nicht** geändert: `src/combat/rules.ts`, die Kampfmechanik, der Golden-Pin.

`strengthOfElements` liefert eine Stufe 0 bis 5 je Wesen, und sie kommt aus dem
**Elementbudget** — der Summe der drei Elemente. Die Quelle ist eine Messung, keine
Annahme: über die zwanzig Basis-Arten liegt `maxHp + attack + defense` zwischen
51561 und 54816, also in gut sechs Prozent, und eine Skala aus diesen Werten hätte
Rauschen in Stufen gegossen. Das Elementbudget liegt zwischen 9500 und 21900 und
trennt die Arten wirklich. Die Schwellen 12000/14000/15000/16500/18500 sind `[K]`,
liegen in den Lücken der gemessenen Verteilung und nicht auf den Werten selbst; die
Verteilung 3/2/4/5/4/2 lässt keine Stufe leer, und drei Arten mit Budget 15400
landen zusammen, weil eine aus dem Budget abgeleitete Stufe keine zwei gleichen
Zahlen zu sortieren braucht.

**Die zweite Wahrheit ist weg.** `speciesBias` war `850 + (hashText(...) % 301)` —
eine zufällige Zahl je Art, die der Stärke widersprechen konnte. Sie ist jetzt
`850 + strengthOfElements(...) * 60`, dasselbe Band, aber aus derselben Größe
abgeleitet. Weil die Ableitung die Basis-Art nicht mehr braucht, verlor
`monsterStats` ihren ersten Parameter; eine Signatur, die eine Art verspricht, wo
sie nichts beiträgt, wäre eine Lüge gewesen. `resolveStats` holt die Art
dadurch nicht mehr und ruft `monsterStats(genome.elements)` direkt.

`lootProfile(genome)` liefert `{ strength, generation }` und ist die einzige
Stelle, die beide Größen der Goldformel zusammenführt — der Genom-Besitzer hat die
Daten, die Dorfwirtschaft rechnet sie aus. **Beleg:** `strength.test.ts` nennt jede
der zwanzig Arten mit ihrer Stufe, prüft die Bandbesetzung und den Gleichstand
gleicher Budgets; `village/loot.test.ts` rechnet echte Genome durch die Formel.
**Gates:** typecheck 0, 423 Tests in 62 Dateien, Shinon PASS.
