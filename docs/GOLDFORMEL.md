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

Die Formel ist freigegeben und in `packages/client/src/village/loot.ts` als reine
Funktion umgesetzt. Sie hat im heutigen Bestand aber **keine Eingabedaten**, und
das ist eine Aussage über den Code, nicht eine Vermutung:

- **Die Stärke-Skala existiert nicht.** `goldForOpponent` rechnet mit einer
  ganzen Stärke ab 0. Die Genome-Registry liefert `monsterStats` mit `maxHp`,
  `attack` und `defense` — kontinuierliche Werte aus Basiskurve plus Art-Bias
  plus drei Elementen. Eine Abbildung von diesen Werten auf die Skala 0 bis 5,
  die die Tabelle oben zugrunde legt, ist nirgends definiert. Die Zahlen 0 bis 5
  stammen aus der Beispieltabelle, nicht aus einer Messung am Bestand.
- **Die Generation existiert nicht.** `BaseMonster` führt eine Art, keinen
  Zuchtstand. Die Mutation in `genome/mutation.ts` erzeugt ein verändertes
  Genom, aber kein Feld, das als „diese Generation" ablesbar wäre.

Damit ist die Formel eine freigegebene **Regel ohne Abnehmer**, und ein Aufrufer
gibt es bewusst noch nicht. `docs/CONCEPT_REVIEW.md` Abschnitt 0a nennt als Quelle
„abhängig von Stärke/Generation"; die Quelle ist mit der Freigabe benannt, sie ist
aber kein Nachweis, dass die Daten irgendwo entstehen. Vor der Verdrahtung ist zu
entscheiden:

1. **Stärke als eigene Größe am Monster.** Ein Feld in `BaseMonster`, gesetzt
   aus der Art, wäre die ehrlichste Lösung: die Stärke ist dann eine Eigenschaft
   der Art und keine Ableitung aus dem Endwert. Sie widerspricht aber der
   bestehenden Zufallsquelle `speciesBias`, die jede Art bisher aus dem Hash
   bekommt — eine zweite Artzahl wäre eine zweite Wahrheit.
2. **Stärke aus dem Endwert ableiten.** Eine Schwellwertung über `maxHp` oder
   `attack` braucht eine Grenze, und die Grenze ist eine `[K]`-Zahl. Sie fiele
   außerdem unter das deterministische Raster, aber nicht darunter, dass sie
   gewartet werden müsste: verschiebt sich `BASE.maxHp`, verschiebt sich die
   Stärke jedes Wesens mit, ohne dass jemand es entschieden hätte.
3. **Stärke aus der Besetzung ableiten** — etwa der Platznummer. Dann wäre die
   Beute eine Funktion des Aufbaus statt des Wesens, und die Tabelle müsste neu
   begründet werden.

Zusätzlich zur Frage der Herkunft bleibt die des Trägers: `CombatSummary` führt
`defendersTotal`, `monstersAlive` und `bossAlive`, also Zählwerte ohne Zuordnung
zu einzelnen Einheiten, und `monsterSlot` im eingefrorenen Snapshot trägt nur
`monsterId`. Ob die Beute Stärke und Generation im Contract trägt (Sprung
`CONTRACT_VERSION 5` auf 6 mit Migration) oder der Client sie über `monsterId`
auflöst, ist die zweite offene Entscheidung — die erste ist die Herkunft der
Zahlen.

## Rendite-Kontext

Der Startbestand sind 120 Gold; der Etage-Kauf kostet 1000 Gold für Etage 2 und
2250 für Etage 3. Eine vollständig geräumte Etage bringt bei fünf Gegnern der
Stärke 1, Generation 1 bis zu 200 Gold. Das ist die Größenordnung, kein
Versprechen: die tatsächliche Beute hängt an der Besetzung, die der Verteidiger
gestellt hat.
