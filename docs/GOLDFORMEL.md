# docs/GOLDFORMEL.md — Die Goldformel der Run-Beute

**Status: freigegeben am 2026-09-29. `[N]`.** Die Zahlen G₁ = 40 und der
Generationsfaktor 0,25 sind entschieden; sie standen bis dahin als `[K]`-Entwurf
in derselben Datei. Die Freigabe betrifft die Rechnung, nicht die Datenlage —
was die Rechnung braucht und was der Contract führt, steht unten getrennt.

## Die Formel

`goldJeGegner = G₁ · Stärke · (1 + 0,25 · (Generation − 1))` mit `G₁ = 40` `[N]`,
summiert über die **gefallenen** Gegner, gerundet auf ganze Goldstücke (`floor`).

| Stärke | Gen 1 | Gen 2 | Gen 3 | Gen 5 | Gen 9 |
|--------|-------|-------|-------|-------|-------|
| 0 | 0 | 0 | 0 | 0 | 0 |
| 1 | 40 | 50 | 60 | 80 | 120 |
| 2 | 80 | 100 | 120 | 160 | 240 |
| 3 | 120 | 150 | 180 | 240 | 360 |
| 5 | 200 | 250 | 300 | 400 | 600 |

Ein geräumter Run aus fünf Gegnern Stärke 1, Gen 1 plus einem Boss Stärke 2, Gen 2
liefert `5 · 40 + 100 = 300` Gold.

## Grenzfälle, freigegeben mit der Formel

- Stärke 0 trägt 0 bei; ein gefallener Gegner ohne Stärkenangabe ebenso.
- Generation 0 oder negativ ist kein gültiger Gegner; die Formel weist ab.
  Dieselbe Ganzzahlgrenze fängt negative oder gebrochene Stärke.
- Gebrochene Stärke oder Generation ergibt keinen Gegnerwert; gerechnet wird
  `floor` auf ganze Goldstücke, damit es keine Goldbruchteile gibt.
- Ein leeres Ergebnis (keine Gegner gefallen) liefert 0 Gold, auch bei Sieg über
  den Boss allein — der Boss ist kein Goldträger.
- Zwei verschiedene Gegner können denselben Wert bringen; die Formel summiert
  Werte, nicht Identitäten.

## Die Datenlage, getrennt von der Formel

**Stand 2026-09-29, nach der Definition: beide Eingaben existieren.** Dieser
Abschnitt hat vorher das Gegenteil behauptet; die Korrektur folgt unten, weil
der Fehler selbst eine Lehre trägt.

### Die Stärke: gemessen, nicht gesetzt

`packages/sim-core/src/genome/strength.ts` liefert `strengthOfElements`, eine
Stufe von 0 bis 5 je Wesen. Sie kommt aus dem **Elementbudget** — der Summe der
drei Elemente —, nicht aus den abgeleiteten Kampfwerten. Der Grund ist
gemessen: über alle zwanzig Basis-Arten liegt `maxHp + attack + defense`
zwischen 51561 und 54816, also in gut sechs Prozent. Eine Skala aus diesen
Werten würde Rauschen in Stufen gießen. Das Elementbudget liegt zwischen 9500
und 21900 und trennt die Arten wirklich.

Die Schwellen 12000, 14000, 15000, 16500 und 18500 sind `[K]` und stehen an der
Quelle. Sie sind keine Rundungszahlen, sondern die Lücken der gemessenen
Verteilung — jede liegt zwischen zwei Arten, keine Art sitzt auf einer Schwelle,
und drei Arten mit Budget 15400 landen garantiert zusammen. Die Verteilung über
die zwanzig Arten ist 3/2/4/5/4/2; jede Stufe ist besetzt. `strength.test.ts`
nennt jede Art mit ihrer Stufe, damit eine Änderung an einem Element sichtbar
wird, statt still eine Art zu verschieben.

**Die zweite Wahrheit ist damit weg.** `speciesBias` kam vorher aus einem Hash
der Basis-ID und war damit eine zweite Zahl für dieselbe Frage „wie ist diese
Art". Eine Art mit Stärke 5, die zufällig 850 würfelte, wäre oben in der Beute
und unten im Kampf gewesen. Jetzt kommt der Bias aus der Stärke selbst,
`850 + Stärke · 60`, also demselben Band von 850 bis 1150 wie vorher. Was sich
ändert, ist die Zuordnung, nicht die Größenordnung.

### Die Generation: sie existierte und war übersehen

`Genome` führt `generation` seit dem Bau der Domäne: 1 für ein Basis-Monster,
`Math.max(a, b) + 1` in `breed`, `generation + 1` in `mutate`, geprüft in
`breeding.test.ts` und `genome.test.ts`. Die frühere Fassung dieses Abschnitts
behauptete, es gebe kein ablesbares Generationsfeld. Das war falsch — es stand
im Quelltext. Die Aussage ist korrigiert, und `CODE IS TRUTH` gilt in beide
Richtungen: nicht nur ein Kommentar, der mehr verspricht als der Code leistet,
ist ein Blocker, sondern auch ein Dokument, das weniger behauptet als der Code
bereits hergibt.

### Die Brücke

`lootProfile(genome)` in `strength.ts` liefert `{ strength, generation }` aus
dem Genom — der Genom-Besitzer hat die Daten, niemand sonst. Die Formel
rechnet weiterhin in `packages/client/src/village/loot.ts`, weil sie eine
Dorfwirtschaftsfrage ist und kein Zuchtergebnis. `loot.test.ts` rechnet beide
Seiten gegeneinander: Steingolem ergibt in Stärke 5 und Generation 1 genau 200
Gold, Shadeprowler in Stärke 0 genau 0 und **ohne** Fehler.

### Was offen bleibt: der Transport

Die Formel hat ihre Eingaben, aber der **Kampfweg** führt sie noch nicht.
`monsterSlot` im eingefrorenen Snapshot trägt nur `monsterId`, und
`CombatSummary` führt `defendersTotal`, `monstersAlive` und `bossAlive` —
Zählwerte ohne Zuordnung zu einzelnen Einheiten. Ein Ergebnis weiß also, *wie
viele* Gegner gefallen sind, nicht *welche*. Die Stärke lässt sich über
`monsterId` aus der Registry auflösen; die Generation nicht, weil sie im
Snapshot nirgends steht. Die eine offene Entscheidung ist damit: trägt der
Contract Stärke und Generation je Einheit (Sprung `CONTRACT_VERSION 5` auf 6
mit Migration), oder wird die Generation Teil der `monsterId`? Beides ist
entscheidbar, nichts davon ist ein Blocker für die Regel selbst.

## Rendite-Kontext

Der Startbestand sind 120 Gold; der Etage-Kauf kostet 1000 Gold für Etage 2 und
2250 für Etage 3. Eine vollständig geräumte Etage bringt bei fünf Gegnern der
Stärke 1, Generation 1 bis zu 200 Gold. Das ist die Größenordnung, kein
Versprechen: die tatsächliche Beute hängt an der Besetzung, die der Verteidiger
gestellt hat.
