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

### Die daraus folgenden Beutewerte

Das ist die Tabelle, über die die Schwellen zu bestätigen sind. Gold in
Generation 1 ist `Stärke · 40`, in Generation 3 `Stärke · 60`, in Generation 9
`Stärke · 120` — die freigegebene Formel, nichts dahinter.

| Art | Stärke | Gen 1 | Gen 3 | Gen 9 |
|-----|--------|-------|-------|-------|
| Ember-Titan, Steingolem | 5 | 200 | 300 | 600 |
| Deep-Lurker, Frost-Herald, Iron-Crawler, Marsh-Horror | 4 | 160 | 240 | 480 |
| Ash-Revenant, Bone-Elder, Bramble-Guard, Ember-Cub, Hollow-Warden | 3 | 120 | 180 | 360 |
| Bone-Thrall, Frostwolf, Mire-Witch, Peat-Crawler | 2 | 80 | 120 | 240 |
| Cinder-Wisp, Mire-Hound | 1 | 40 | 60 | 120 |
| Grave-Moth, Shade-Prowler, Shard-Imp | 0 | 0 | 0 | 0 |

**Drei Arten bringen 0 Gold, in jeder Generation.** Das ist kein Rundungsfehler,
sondern eine Eigenschaft der untersten Stufe: Stärke 0 trägt per Formel nichts
bei. Die Frage, die damit gestellt ist, lautet nicht „welche Schwelle ist
richtig", sondern **ob die schwächsten Arten im Dungeon überhaupt Beute wert
sein sollen**. Drei mögliche Antworten, jede mit Preis:

- **So lassen.** Die drei Arten sind Zuchtmaterial und Kampffutter, keine
  Goldquelle. Wer sie stellt, opfert Einkommen für schwache Gegner — das ist
  eine bewusste Kostenrechnung und der stärkste Grund für diese Verteilung.
- **Minimum 1.** Die Skala beginnt bei 1 statt 0, alle Arten tragen mindestens
  40 Gold. Die Schwellen müssten um eine Stufe wandern, und die unterste Stufe
  hätte wiederum zwei bis drei Arten.
- **Basislohn.** Jeder gefallene Gegner bringt einen Grundbetrag, die Stärke
  kommt obendrauf. Das ist eine **Formeländerung**, keine Schwellenfrage, und
  sie braucht eine eigene Freigabe — die freigegebene Formel kennt keinen
  Grundbetrag.

Welche davon gilt, ist nicht abgeleitbar und liegt bei der Freigabe. Solange
sie offen ist, bleiben die Schwellen `[K]`, und `strength.test.ts` hält die
Zuordnung fest, damit eine spätere Entscheidung nicht durch eine nebenbei
geänderte Zahl überschrieben wird.

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

### Der Transport: `generation` am Slot, `CONTRACT_VERSION 6`

**Entschieden am 2026-09-29.** Die Generation steht seit v6 als eigenes Feld am
`monsterSlot` im eingefrorenen Snapshot, nicht in der `monsterId`.

Der Grund ist eine Kopplung, die vorher keiner gesehen hatte: `genome/mutation.ts`
salzt den Zucht-Seed mit `hashText(hashStart(), genome.baseId)`, und
`baseGenome()` legt die geparzte ID als `baseId` ins Genom. **Läge die
Generation im String, ginge sie als Salz in den Seed ein** — jeder Zuchtwurf
hinge dann an der Beute-Kennzeichnung, und der Replay-Hash eines eingefrorenen
Runs verschöbe sich mit. Als eigenes Feld bleibt der Seed unberührt: ein
v5-Snapshot und dieselbe Zucht ergeben heute wie morgen dasselbe Wesen.

Die beiden Kandidaten und ihre Preise:

- **Generation in der `monsterId`.** Gespart: ein Feldes, ein Versionssprung.
  Gezahlt: eine gekappte ID-Form, die an drei Stellen geparst werden müsste
  (`combat-source.ts` für die Sprite-Zuordnung, `baseGenome`, das Seed-Salz
  mit Rückrechnung), plus eine Parse-Regel, die niemand liest, aber jeder
  Aufrufer berühren muss.
- **Generation am Slot (gewählt).** Gezahlt: ein Contract-Sprung mit Migration
  und `sim_version` 0.0.4 auf 0.0.5. Gekauft: eine sauber getrennte Sache, die
  das Schreiben eines Checkpoints betrifft, nicht die Kampfregel.

`slotLootProfile` in `strength.ts` ist der geschlossene Transportweg: `monsterId`
wird über die Registry zur Basisart, daraus die Stärke, die Generation steht am
Slot. Ein leerer Platz und eine unbekannte Art ergeben beide `null` — es gibt
kein Wesen, dessen Beute man rechnen könnte, und die Formel soll dafür keine
Zahl erfinden.

**Die Migration schreibt, sie löscht nicht — anders als `003`.** Das neue Feld
ist optional, und ein fehlendes `generation` bedeutet Generation 1. Ein
v5-Snapshot enthält zwangsläufig nur Basis-Monster, denn Gezüchtete waren vor
v6 gar nicht darstellbar. Jede v5-Zeile ist damit semantisch bereits eine
v6-Zeile; sie wird nicht unlesbar, sondern vollständig. `004_contract_v6.sql`
hebt deshalb nur die Versionsfelder an und fasst sonst nichts an. Die Kampf-
rechnung ändert sich dabei nicht: dieselben Einheiten mit demselben Seed
ergeben denselben Log und denselben Hash.

**Gegenprobe statt Behauptung:** `raid-migration-v6.test.mjs` legt einen
v5-Bestand an, fährt die Migration und prüft, dass der Snapshot auf 0.0.5 und
6 steht, der Job erhalten bleibt und eine spätere Version unberührt ist.
`strength.test.ts` pinnt zusätzlich, dass dieselbe Slot-Angabe immer dasselbe
Profil ergibt und eine Mutation des Genoms daran nichts ändert.

## Rendite-Kontext

Der Startbestand sind 120 Gold; der Etage-Kauf kostet 1000 Gold für Etage 2 und
2250 für Etage 3. Eine vollständig geräumte Etage bringt bei fünf Gegnern der
Stärke 1, Generation 1 bis zu 200 Gold. Das ist die Größenordnung, kein
Versprechen: die tatsächliche Beute hängt an der Besetzung, die der Verteidiger
gestellt hat.
