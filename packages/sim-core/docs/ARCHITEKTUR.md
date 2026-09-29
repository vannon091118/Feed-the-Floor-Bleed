# packages/sim-core/docs/ARCHITEKTUR.md

## Rolle

Deterministischer, I/O-freier Core. Alle Simulation rein über PRNG-Seed, Fixed-Point
und feste Tick-Reihenfolge. Kein Zugriff auf Client, Server, `fs` oder Zeit.

## Module

- `prng` Mulberry32 (`createRng`, `nextUint32`, `nextBelow`, `nextRange`) plus
  `deriveSeed(seed, index, salt)` für unabhängige Sub-Streams pro Aktion.
- `math` Fixed-Point (Skala 1000) mit `mulFixed`, `divFixed`, `clampInt`, `absInt`
  sowie `isqrt`/`sqrtFixed` ohne `Math.sqrt`.
- `hash` FNV-1a-Kette über Wörter und Text (`hashStart`, `hashWord`, `hashText`,
  `hashFinish`, `hashToHex`).
- `grid` 64x64, fünf Tile-Typen, Breitensuche in `grid/path.ts` mit fester
  Nachbar-Reihenfolge und FIFO-Warteschlange. Boden, Spawn, Boss und die
  Platzierungsmarkierung kosten gleich viel, Wände sind unpassierbar — deshalb
  braucht die Suche weder Heap noch Umwegbudget; die gewichtete Suche mit
  Rückfallzweig ist mit der Falle am 2026-09-29 entfallen.
- `combat` bounded Tick-Simulation (`simulateCombat`) mit deterministischer
  Zielwahl, Seed-Varianz pro Angriff, Event-Log und kanonischem Log-Hash.
- `combat/boss.ts` besitzt den Boss: `isBoss`/`isBossAlive` als einzige
  Rollenerkennung, `BOSS_RULES` als seine Ausgangswerte und `bossSpec` als
  Spec-Bau. Boss-exklusive Verstärkungen gehören hierher.
- `combat/summary.ts` verdichtet den Log zu einer typisierten Kurzfassung, inklusive `defendersTotal` — dem eingefrorenen Verteidiger-Roster.
- `combat/resolve-snapshot.ts` setzt den Contract-Envelope und liefert
  Ergebnis plus Log als zwei getrennte Payloads.
- `combat/fixture-job.ts` führt einen Auftrag lokal aus: Schema, Frist, Route,
  Kampf, Replay-Prüfung — und gibt einen validierten `RaidJob` zurück.
- `grid/serialize.ts` übersetzt Contract-Payload und Laufzeit-Grid in beide Richtungen.

## Vertrag und Version

`sim-core` kennt keine Protokollversion. `combat/types.ts` bleibt ein reiner
Engine-Typ; erst `resolve-snapshot.ts` hüllt das Ergebnis in den Envelope aus
`@floor/contracts`. Der Core darf Contracts importieren, aber kein Contract
darf vom Core abhängen.

## Keine Uhr, keine Nebenwirkung

`runFixtureRaid` liest weder `Date` noch einen globalen Zufallsgenerator. Zeit
kommt als `createdAt` und `observedAt` von außen, der Seed ebenso. Damit ist
jeder Fixture-Lauf im Test und im Browser wiederholbar. Das ist kein Zufalls-
feature, sondern die Bedingung dafür, dass ein Replay-Hash überhaupt etwas
aussagt.

## Trail seit T1.1

Seit T1.1 fließt der vollständige Trail aus dem Grid in den Kampf: `resolveCombat` zieht die Route, baut `trail[]` mit `x/y/cell` je Schritt und reicht ihn an `simulateCombat`; `fingerprintCombatLog` hasht jede `CombatTrailEntry` vor Units und Events. Ein manipulierter Trail ändert damit den Hash, den `replayCombat`/`verifyCombatLog` abschließend vergleichen — der Trail ist über den Hash abgesichert, nicht über einen separaten Zellvergleich. Gleich lange Routen mit anderer Geometrie liefern jetzt unterschiedliche Hashes — der gepinnte Test `raid-job.test.ts` ist grün. `genome` ist seit dem 2026-09-29 gebaut; `items` und `ghost` sind weiterhin offen.

## Genome

`src/genome/` besitzt Zucht, Stats und Gen-Seed und rechnet keine Kämpfe.

Der Besitz ist eine reine Datenstruktur: `Genome` trägt `baseId`, `generation`,
drei `elements`, `traits` und `bonuses`. Die Kampfwerte werden **nicht**
gespeichert, sondern bei Bedarf aus den Elementen neu abgeleitet (`stats.ts`),
damit die Ableitungsregel wachsen kann, ohne alte Genome eine eingefrorene
Kopie zu tragen. `resolve.ts` hält die Reihenfolge fest: erst die Kopplung
aus den Elementen, dann die Traits, dann die Boni.

`src/genome/strength.ts` besitzt die **Stärke** eines Wesens, eine Stufe von 0
bis 5, und ist die zweite Eingabe der Goldformel (`docs/GOLDFORMEL.md`). Sie
kommt aus dem Elementbudget, der Summe der drei Elemente, nicht aus den
abgeleiteten Kampfwerten: gemessen über die zwanzig Basis-Arten liegen die
aggregierten Kampfwerte in gut sechs Prozent, das Elementbudget in gut
zweieinhalbfach. Die Schwellen sind `[K]`, liegen in den Lücken der gemessenen
Verteilung und stehen an der Quelle. `speciesBias` in `stats.ts` leitet sich
aus dieser Stärke ab (`850 + Stärke · 60`) und nicht mehr aus einem Hash der
Basis-ID — vorher standen zwei Zahlen für dieselbe Frage, und sie konnten sich
widersprechen. `lootProfile` liefert `{ strength, generation }` aus einem Genom
und ist die Brücke zur Dorfwirtschaft; die Formel selbst rechnet im Client.

`registry.ts` ist der einzige Nachschlageort für ein Basis-Monster und prüft
seine Invarianten beim Laden, nicht beim Aufruf. `mutation.ts` ist die einzige
Stelle, die würfelt, und zwar ausschließlich über den internen PRNG. Die
gekoppelten Elemente sind der Grund, warum aus zwanzig Basisarten ein Spektrum
und kein Zufallsnebel entsteht: jedes Element zieht sein Gegenstück runter.

## Combat-Regeln

Die HP-, Angriffs- und Cooldown-Werte von Helden und Monstern stehen zentral als
`PROVISIONAL_RULES` in `src/combat/rules.ts`, die des Bosses als `BOSS_RULES` in
`src/combat/boss.ts`. Beide sind nicht abgenommen (`[K]` in
`docs/CONCEPT_REVIEW.md`) und werden dort ersetzt, ohne die Engine umzubauen. Die
Engine selbst kennt keine eigenen Balancing-Zahlen.

`genome/stats.ts` liest `PROVISIONAL_RULES.monster` als Nullpunkt, statt eine
zweite Kopie der Basiswerte zu halten. `genome` rechnet damit keine Kämpfe, es
verwendet dieselben Ausgangswerte.

## Eine Quelle der Überlebendenzahlen

`summary.ts` ist die einzige Stelle, die Überlebende zählt. `monstersAlive`
zählt ohne den Boss — er trägt `side: 'monsters'`, ist aber ein eigenes Wesen mit
eigenem Feld `bossAlive` — und alle drei Zahlen gehen aus derselben
Rollenerkennung (`isBoss`/`isBossAlive`) hervor. Der Ergebnislog im Client liest
diese Werte über `summarizeCombat`, statt sie ein zweites Mal zu zählen.
Dasselbe gilt für `defendersTotal`: Die Zahl der eingefrorenen Verteidiger
kommt aus der Einheitenliste des Logs und nicht aus dem Upload, den der Client
oder der Server daneben hält. Aus `defendersTotal` minus den Überlebenden ist
die Zahl der gefallenen Gegner ableitbar, ohne den Log zu laden.

## Regeln

Kein `Math.random`, `Date`, `Math.sin/pow/cos/tan/sqrt`, `parseFloat` und kein
`while (true)` in Combat. Event-Reihenfolge und Hash-Eingaben sind kanonisch,
damit derselbe Seed und Snapshot denselben Hash und identischen Log ergeben.
