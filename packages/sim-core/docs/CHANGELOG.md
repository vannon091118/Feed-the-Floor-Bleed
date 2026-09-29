# packages/sim-core/docs/CHANGELOG.md

## 2026-09-29 — Die Nachwirkung bekommt ihren ersten Leser, und sie steht im Spec

**Scope:** neu `src/combat/conditions.ts` und `src/combat/conditions.test.ts`; geändert `src/combat/rules.ts` (`heroSpec` nimmt eine Bedingung, `BuildUnitsInput.team?`), `src/combat/resolve.ts` (`ResolveCombatInput.team?`), `src/combat/resolve-snapshot.ts` (`SnapshotRaidInput.team?`), `src/combat/fixture-job.ts` (`team: parsed.data.activeTeam`) und `src/combat/index.ts` (Barrel). Keine neue Kampfzahl, kein Contract, kein Hash.

**Der Transport war geschlossen, der Konsument fehlte.** `temporaryFatigue` und `temporaryInjury` sind seit Contract v8 Pflichtfelder von `activeTeam`, und der Core hat sie bis hierhin nie gelesen. `fixture-job.ts` gibt sie jetzt an `resolveSnapshotRaid` weiter — es ist der erste Aufrufer im Repo, der dieses Feld überhaupt benutzt —, und `rules.ts` rechnet sie über `heroInitiative` in die Initiative: eine Wunde kostet 20 %, eine Stufe Erschöpfung 10 %, **verkettet** statt addiert (zwei Wunden 36 % statt 40 %), je Stufe gekappt bei fünf; die Werte sind `[K]` und stehen mit ihrem Vermerk an der Quelle in `conditions.ts`. Der Wert reist durch `heroSpec` in `CombatUnitSpec.initiative` und nicht in ein Feld daneben, weil `specHash` die Einheit vollständig hasht und ein Replay nur den Log liest: eine geminderte Initiative, die nur im Speicher läge, wäre im Replay nicht vorhanden. `team` ist durchweg optional und fehlt in den reinen Engine-Aufrufen (Golden-Pin, Balancemessung) — dort kämpft das Team unversehrt, und deshalb bleiben `98cd6dda` und `ebbe2010` Zeichen für Zeichen stehen. Belegt ist die Naht in `conditions.test.ts`: Einzel- und Kettenrechnung ((1,0) 400, (1,1) 360, (2,0) 320), die Kappung ((5,0) gleich (50,0)) und derselbe `resolveCombat`-Aufruf mit und ohne Bedingung, gefiltert auf `role === 'hero'`, weil der Boss auf Routenposition 0 sitzt. **Gates:** typecheck 0, 530 Tests in 78 Dateien, Lint 0, LOC-Caps ok, Hygiene ok.

## 2026-09-29 — Die Heldenklasse steht im Spec, ohne dass jemand sie liest

**Scope:** geändert `src/combat/types.ts` (Feld `class`, Stufe `extracted`, Ereignisarten `ability`/`reveal`), `rules.ts` und `boss.ts` (`class: 'none'`), `fingerprint.ts` (`class` im `specHash`), `ambush.test.ts`, `behavior.test.ts` und `balance-report.test.ts`. Neue Mechanik: keine.

**Ein Feld ohne Leser wäre eine zweite Wahrheit — dieses Feld ist in v9 trotzdem keines.** Contract v9 verlangt `class` an jeder Einheit, weil ein Replay ausschließlich den Log liest. Der Core schreibt deshalb überall `none`: klassenlose Helden, Monster und Boss gleichermaßen. Erst der Klassen-Slice füllt die Zuordnung aus dem Snapshot; bis dahin ist `none` der einzige Wert und die Engine tut genau das, was sie vor Phase 3 tat.

**Der Pin belegt, dass sich nichts bewegt hat.** `class` steht im `specHash`, also verschieben sich beide Golden-Werte (`98cd6dda`, `ebbe2010`), während Ticks, Ereignisse, Trail und Stufe Zeichen für Zeichen dieselben bleiben. Genau das ist die Aussage: der Hash folgt dem Feld, nicht dem Verhalten. `sim_version 0.0.7→0.0.8`, `CONTRACT_VERSION 8→9`, Migration `007_contract_v9.sql`.

**Gates:** typecheck 0, 524 Tests in 77 Dateien, Lint 0, LOC-Caps ok, Hygiene ok.

## 2026-09-29 — Das Verhalten kommt aus dem Genom und entscheidet das Ziel

**Scope:** neu `src/genome/behavior.ts` mit `src/genome/behavior.test.ts` und `src/combat/behavior.test.ts`. Geändert `src/genome/index.ts`, `src/combat/types.ts`, `rules.ts`, `boss.ts`, `state.ts`, `simulate.ts`, `fingerprint.ts`, `ambush.test.ts` und `combat-pin.test.ts`.

**Ein Profil, kein zweiter Zahlensatz.** Jeder Verteidiger trägt ein `behavior`, abgeleitet aus dem Trait seiner Art (`behaviorForTrait`): Zähigkeit und Schwertritt werden zum `tank`, der scharfe Angriff zum `hunter`, der ruhige Zug zum `control`, die Tempo-Traits bleiben beim Grundfall `none`. Die Zuordnung ist `[K]` und steht mit ihrem Vermerk in `genome/behavior.ts`. Die Profile ändern **keine einzige Kampfzahl** — dieselbe Grenze, die die Effektdateien halten: ein Trait, der gibt, nimmt dagegen. `ambush`, `support` und `swarm` bleiben bewusst unbelegt, solange die Mechanik dahinter fehlt (der Hinterhalt hängt an der Zone, `support` braucht T2.4, `swarm` braucht K4).

**Genau eine Stelle liest das Profil.** `chooseOpponent` ersetzt `nearestOpponent` in `state.ts`: `none` wählt wie früher das Ziel mit dem kürzesten Route-Abstand, `tank` das höchste Lebensverhältnis, `hunter` das niedrigste, `control` die höchste Initiative. Der Lebensvergleich läuft über Kreuzprodukt statt Division, die Schleife in Einheitenreihenfolge mit striktem Ungleich — bei Gleichstand bleibt der zuerst gefundene Kandidat stehen, also liefert derselbe Kampf dieselbe Wahl, ohne dass ein zweiter Zufall die Entscheidung trüge. Das Feld steht am Spec und im Log (`CombatUnitSpec.behavior`), weil ein Replay nur den Log liest und die Zielwahl sonst neu erfunden wäre; Helden, Boss und unbekannte Arten bekommen `'none'`.

**Der Hash verschiebt sich, und der Pin sagt warum.** `specHash` nimmt `behavior` auf, und auf der Umweg-Route wählen die neuen Profile ein anderes Ziel als die alte Regel: Der Golden-Pin steht jetzt auf `9f919007` (offenes Fixture-Grid, 413 Ereignisse, 216 Ticks — hier fiel die Wahl mit der alten zusammen) und `f93e3175` (Umweg-Route, 674 Ereignisse, 166 statt 165 Ticks). Beide Verschiebungen samt Grund stehen im Kopf der Pin-Datei. `sim_version 0.0.6→0.0.7`, `CONTRACT_VERSION 7→8`, Migration `006_contract_v8.sql`.

**Gates:** typecheck 0, 500 Tests in 73 Dateien, Lint 0, LOC-Caps ok, Hygiene ok, Shinon PASS.

## 2026-09-29 — Eine Nachbarschaft, eine Flutfüllung, und die Periode war eine Behauptung

**Die Dublette war echt, und das redundancy-gate sah sie nicht.** `zones.ts` führte zwei Flutfüllungen: eine für die Platzierungsgruppen, eine für die Zonen, mit derselben Schleife und je eigenem Prädikat. Dazu kam `NEIGHBORS` ein zweites Mal neben `path.ts` — zwei Nachbarschaftsdefinitionen in einer Domain. Das Gate vergleicht wörtliche sechs Zeilen; die Schleifen unterschieden sich in der Mitte, also war es still. Der Befund war damit doppelt einer: eine Dublette und eine Lücke im Gate. Beides ist hier ausgesprochen, nicht umgangen. Geändert sind `src/grid/grid.ts`, `path.ts` und `zones.ts`, neu ist `src/grid/neighbors.test.ts`.

**Der Fix ist eine gemeinsame Wahrheit statt zweier.** `grid/grid.ts` besitzt jetzt die Geometrie (`indexOf`, `pointOf`, `neighbors`) als die einzige Stelle, an der das vierer-Nachbarschaftsverhältnis steht; `path.ts` und `zones.ts` lesen dort. `zones.ts` führt mit `component` **eine** Flutfüllung und ein einziges Merkfeld. `path.ts` verlor seinen eigenen Nachbarvektor und die Randprüfung; die Suchschleife arbeitet jetzt in Zellnummern statt in Punkten.

**Die Nachbar-Reihenfolge ist Regel und jetzt gepinnt.** Sie ist rechts, unten, links, oben, und `path.ts` bricht Gleichstand über sie. Gemessen ändert eine Umordnung den Weg bei **gleicher Länge** (127 Schritte, anderer Weg) — der Test `path.test.ts` vergleicht jedoch nur einen Lauf mit sich selbst und blieb in der Gegenprobe grün. `neighbors.test.ts` pinnt deshalb Reihenfolge und Randverhalten (Ecke zwei, Kante drei, kein Zeilenumbruch); die Umordnung lässt zwei Fälle fallen.

**Zur Zahl aus dem Review: „Periode 16.253" ist nicht belegt.** Geprüft wurden die Seeds 0 bis 2999 gegen die alte Rückkopplung; keine Periode lag unter zwei Millionen Ziehungen, und der Seed 16253 selbst bricht erst darüber hinaus. Die Rückkopplung war ein echter Fehler (siehe den Eintrag weiter unten), aber ihr Schaden ist die Nicht-Überspringbarkeit, nicht eine kurze Periode.

**Gates:** typecheck 0, 492 Tests in 71 Dateien, Lint 0, LOC-Caps ok (306 Quellen), Hygiene ok, Shinon PASS. Kein Hash hat sich bewegt: die Route und damit beide Golden-Pins sind unverändert, weil die Reihenfolge dieselbe geblieben ist.

## 2026-09-29 — Der Zähler ist der Zustand, und die Kopie hängt wieder am selben Faden

**Der Fehler war echt, und er war zweimal.** Beide Fassungen (`src/prng/mulberry32.ts`, `../../client/tools/palette.mjs`) schrieben den **gemischten** Wert zurück in den Zustand (`rng.state = value`, `state = value`). Damit war der Zustand kein Additionszähler mehr, sondern eine rückgekoppelte Mischung, und die Folge wich ab dem **zweiten** Zug vom mulberry32 ab (gemessen: Seed 42, Repo `2581720956 1581101073 …` gegen Referenz `2581720956 1925393290 …`). Ein Rückkopplungszustand lässt sich nicht überspringen, nicht fortsetzen und nicht aus Seed und Tick berechnen — er ist eine verdichtete Geschichte. Neu sind `docs/historisch/2026-09-26_changelog-review-nachgang-t1-1.md` und `2026-09-27_changelog-divfixed-grenze.md` (Zeilengrenze).

**Warum es unentdeckt blieb, ist der eigentliche Befund.** `combat/actions.ts` legt pro Wurf einen neuen Strom aus einem abgeleiteten Seed an und zieht **genau einmal** — und die erste Ziehung ist mit und ohne Rückkopplung bitgleich. Der abweichende Teil des Stroms wurde im Kampf also nie erreicht; `genome/mutation.ts` zieht dagegen mehrere Werte aus einem Strom, weshalb die Abweichung dort gewirkt hat, ohne dass ein Test ein Ergebnis gepinnt hätte. Ein Test auf Abwesenheit von Periodeneinbrüchen war ebenfalls nicht der Grund: über zwei Millionen Ziehungen bricht die Periode in beiden Fassungen nicht ein. Die Bilder waren nie kaputt.

**Der Vorwurf an die Tests trifft nicht.** `asset-palette.test.ts` pinnte drei Eigenschaften (gleicher Seed gleiche Folge, Werte unter 1, `nextBelow` unter der Schranke) und **keinen einzigen Zahlenwert**; `asset-generator.test.ts` pinnt Reproduzierbarkeit, nicht Bytes. Ein Pin auf Zahlen ist ohnehin kein Argument gegen eine Änderung, sondern deren Werkzeug. Neu sind deshalb zwei Tests, die die Lücke schließen: der publizierte mulberry32-Vektor und die Zählerinvariante `state === (seed + n · K)` in `prng.test.ts`, und der Abgleich der Werkzeugkopie gegen `sim-core` über zehn Ziehungen im Client-Test. Gegenprobe: die alte Zeile wieder eingefügt, der Abgleichstest meldet rot. **Kein Lauf hat sich geändert** — beide Golden-Pins des Kampfes (`1e2b3767`, `27826361`) stehen unverändert, weil sie auf Wurf 1 nie die Mischung erreichen; `sim_version` und `CONTRACT_VERSION` bleiben. **Sichtbar ist dagegen die Pixelrente:** `asset-generator.test.ts` schreibt die sechs Spritesheets bei jedem Lauf neu, und mit dem reparierten Zähler ist das Bildrauschen ein anderes — `packages/client/public/assets/` trägt sechs geänderte Blätter. Es sind dekorative Pixel ohne Regelbezug, aber sie sind diffsichtbar und deshalb hier ausgesprochen statt als „unverändert" behauptet.

**Gates:** typecheck 0, 489 Tests in 70 Dateien, Lint 0, LOC-Caps ok (305 Quellen), Hygiene ok, Shinon PASS.

## 2026-09-29 — Die sechs Archetypen sind am Wesen, nicht am Genom

**Scope:** neu `src/genome/archetypes.test.ts`. Geändert `src/genome/types.ts`, `roster-a.ts`, `roster-b.ts`, `registry.ts`, `index.ts` und `src/combat/balance-report.test.ts`.

**Die Rollen sind eine feste Eigenschaft der Basis-Art.** `BaseMonster` trägt jetzt `archetype` — `tank`, `damage`, `support`, `ambusher`, `controller`, `swarm` — und die Registry weist sie beim Laden zurück, wenn sie nicht im Pool steht. Sie wandert **nicht** in `Genome`: die Art folgt bei der Zucht einem Elternteil, also genügt `baseMonster(genome.baseId).archetype`. Ein zweites Rollenfeld im Genom wäre eine zweite Wahrheit über dieselbe Sache und stünde in jedem eingefrorenen Contract-Stand. Der Golden-Pin ist deshalb unverändert.

**Die Zuordnung der zwanzig Arten ist `[K]`** und aus dem Zahlenprofil abgelesen, nicht aus einer abgenommenen Rollenliste: `roster-a` trägt vier Tanks, drei Schadenslinge, zwei Hinterhalter und einen Schwarm, `roster-b` zwei Tanks, einen Schadensling, drei Stützen, einen Hinterhalter und zwei Schwarm-Wesen. Zusammen sind es sechs Tanks in zwanzig — eine Schieflage, die erst sichtbar wird, wenn der Kampf die Rolle liest.

**Die Messung sagt, dass er es noch nicht tut.** Neu ist `missArchetyp` im Balance-Werkzeug: jede Art ihrer Rolle einzeln im Verteidigerplatz, `SEEDS` Seeds je Art. Bei 64 Seeds gewinnen **alle sechs Rollen zu 0 bis 1 Prozent gegen drei Helden**, die Spanne zwischen Tank und Schwarm ist also kleiner als das Rauschen. Das ist kein Fehler im Roster, sondern der Beleg, dass `archetype` heute reine Daten sind: die Kampfwerte kommen aus den Elementen (`stats.ts`), und die Rolle ändert daran nichts. Sie ist der Schlüssel für Taktik und Balance, nicht deren Wirkung.

**Gates:** typecheck 0, 486 Tests in 70 Dateien, Lint 0, LOC-Caps ok (305 Quellen), Hygiene ok, Shinon PASS.

## 2026-09-29 — Die Bewegung läuft wieder auf der Route, und die Zonen tragen den Hinterhalt

**Scope:** neu `src/grid/zones.ts`, `src/combat/ambush.test.ts` und `src/combat/trail-fixture.ts`. Geändert `src/combat/types.ts`, `actions.ts`, `state.ts`, `rules.ts`, `resolve.ts`, `simulate.ts`, `fingerprint.ts`, `boss.ts`, `combat.test.ts`, `species-wiring.test.ts`, `combat-pin.test.ts` und `src/grid/index.ts`.

**Warum der zweite Ortskontext nicht bleiben durfte.** Ein Zwischenstand ließ Einheiten frei in der Fläche laufen und wollte `simulateCombat` neben dem Trail einen `CombatSpatialContext` mit `walkable` und `zoneByCell` geben. Das war mit der Replay-Prüfung unvereinbar: `replayCombat(log)` und `verifyCombatLog(log)` lesen ausschließlich den Log, und eine Begehbarkeit, die nur im Grid steht, hätte jeden gespeicherten Lauf unverifizierbar gemacht. `CombatSpatialContext` und `nextSpatialStep` sind deshalb entfernt; `distanceBetween` und `applyMove` rechnen wieder über den Route-Index, und `createUnitStates` liest die Zone einer Einheit aus `trail[routeIndex]`. Dass eine Gruppe ihren Weg als Patrouille läuft, steht so in `docs/CONCEPT_REVIEW.md` — die freie Fläche war nie entschieden.

**Die Zonen sind verdrahtet, statt danebenzuliegen.** `resolveCombat` klassifiziert den Dungeon einmal (`classifyDungeonZones`), stempelt die Zonen-ID in jeden Trail-Schritt und übergibt die Platzierungsgruppen samt ihrer Zonen-IDs an `buildCombatUnits`. Eine Gruppe bindet einen Slot an ihren Ort (Schwerpunkt, dann der nächste Routenpunkt); ohne Gruppe verteilt der Rückfall die Verteidiger gleichmäßig über die Route. `CombatUnitSpec` trägt die Zonen-ID als `ambushZoneId`, `CombatUnitState` daraus `ambushAvailable`. Der erste Angriff eines so aufgestellten Verteidigers durchdringt `PROVISIONAL_RULES.ambushDefensePenetrationPermille` der gegnerischen Rüstung und schreibt ein `ambush`-Ereignis vor den Angriff.

**Die Bedingung ist entschieden: der Ort des Ziels zählt, nicht sein Tick.** Die Aufstellung entscheidet, **wer** überrascht (`ambushAvailable`, abgeleitet aus `ambushZoneId >= 0`); ob der Schlag sitzt, entscheidet die Zone des Ziels zur Angriffszeit. Steht es in genau der Zone, in der der Verteidiger aufgestellt war, ist die Lauer entdeckt: der Angriff läuft normal, und der Hinterhalt bleibt für ein Ziel außerhalb verfügbar — verbraucht wird er erst, wenn er trifft. Damit liest die Regel beide Zonen aus dem Log statt aus dem Raster, und `replayCombat` kann sie ohne Grid stellen. Der Test in `ambush.test.ts` prüft die Rechnung an der Einheit, das Ausbleiben gegen ein Ziel in der Lauerzone samt späterem Treffer und das Ausbleiben ohne Platzierungsgruppe. `grid/index.ts` exportiert `zones.ts` jetzt, vorher war die Datei ohne Aufrufer.

**Was ersatzlos weg ist.** `geometry: number[]` am Log (kein Erzeuger, der Contract ist `.strict()` und kannte es nicht), das `zone`-Ereignis und `zoneType` (nie gepusht), `CombatSpatialContext` und `nextSpatialStep` (siehe oben), die `x/y`-Felder am Spec (aus `trail[routeIndex]` herleitbar) sowie `PROVISIONAL_RULES.route.monsterRatioStart/End`, seit die Slot-Ratio durch die Platzierungsgruppen ersetzt ist.

**Der Hash verschiebt sich, und der Pin sagt warum.** `fingerprintCombatLog` hasht jetzt auch `trail[].zoneId` und `spec.ambushZoneId`; die Bewegung ist kürzer und die Verteidiger stehen an anderen Orten. Der Golden-Pin steht auf `1e2b3767` (offenes Fixture-Grid, 413 Ereignisse) und `27826361` (Umweg-Route, 165 Ticks, 674 Ereignisse); die drei Gründe und der Versionszug stehen im Kopf der Pin-Datei. `sim_version 0.0.5→0.0.6`, `CONTRACT_VERSION 6→7`.

**Gates:** typecheck 0, 474 Tests in 69 Dateien, Lint 0, LOC-Caps ok (304 Quellen), Hygiene ok, Shinon PASS, Client-Build 425,01 kB.

## 2026-09-29 — Der Kampf kennt die Art des Verteidigers

**Scope:** neu `src/units.ts` und `src/combat/species-wiring.test.ts`. Geändert `src/combat/rules.ts`, `resolve.ts`, `resolve-snapshot.ts`, `fixture-job.ts`, `balance-report.test.ts`, `combat.test.ts`, `combat-pin.test.ts` und `src/genome/stats.ts`.

`resolveCombat` nahm bis hier nur die **Anzahl** belegter Plätze entgegen, und
`fixture-job.ts` zählte die `monsterId` vorher zu dieser Anzahl zusammen. Damit
war die Identität jedes Wesens auf dem Weg vom Snapshot bis `buildCombatUnits`
verloren, und `monsterSpec` gab jedem Slot dieselben Werte aus
`PROVISIONAL_RULES.monster` — fünf Slots waren fünf Kopien. Jetzt nimmt
`resolveCombat` `defenders` entgegen, eine Liste mit `baseId` je Slot und `null`
für leere Plätze, und die Werte kommen aus `monsterStats` der Art. Eine unbekannte
Art bekommt den generischen Platzhalter statt einen Abbruch, damit ein veralteter
Snapshot die Expedition nicht beendet.

**Ein Importkreis musste aufgelöst werden.** Als `combat/rules.ts` anfing, über
`genome` die Art zu holen, schloss sich `combat/rules` → `genome/stats` →
`combat/rules`, und der erste Zugriff auf `PROVISIONAL_RULES.monster` warf
`Cannot read properties of undefined`. Die Ausgangswerte der Einheiten liegen
jetzt in `src/units.ts`, das keine der beiden Domänen besitzt; beide lesen
`UNIT_BASE` direkt, damit es keine zweite Wahrheit gibt.

**Der Golden-Pin ist gewandert, und der Grund steht nicht im Test.** `94ba1954`
wurde zu `97907d56` (225 → 216 Ticks), `f85b31c0` zu `2759f7d8` (401 → **180**
Ticks). Der zweite Lauf ist der Beleg für einen Größenordnungsfehler: fünf echte
Monster mit je rund 41000 Gesundheit beenden den Kampf in 180 statt 401 Ticks
gegen Helden mit je 60000. Vorher liefen dort fünf Kopien mit 40000. **Die Zahl,
die das richtet, ist eine `[K]`-Größe und wird nicht hier erfunden** — siehe
`docs/CONCEPT_REVIEW.md` Abschnitt 0b. `balance-report.test.ts` misst jetzt mit
echten Arten und meldet 0 % Helden-Siegquote ab **einem** Monster, vorher 0 % ab drei.

**Gates:** typecheck 0, 435 Tests in 63 Dateien, Shinon PASS.

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

## 2026-09-29 — Zwanzig Basis-Monster, Traits und Boni, und die Mutation über den PRNG

**Scope:** neu `src/genome/` mit 22 Quellen und 2 Testdateien. Geändert `src/index.ts` (der Export der Domäne). **Nicht** geändert: die Kampfmechanik — `src/combat/rules.ts` bleibt unberührt, der Golden-Pin bleibt wortgleich grün.

Die Domäne `genome` ist damit gebaut und nicht mehr offen: sie besitzt Zucht, Stats und Gen-Seed. Der Pool führt **zwanzig** Basis-Monster (`roster-a.ts`, `roster-b.ts`), jedes mit drei Elementen zwischen 1,00 und 10,00, einer Palette, einem Trait und einem Bonus. Die Zahl ist die aus der Spieldesign-Aussage vom 2026-09-29; `docs/CONCEPT_REVIEW.md` nannte zuvor „25" und hatte die Liste selbst als ungeprüft markiert — beide Stellen sind jetzt auf den offenen Widerspruch nachgezogen, statt ihn stillschweigend zu glätten.

**Alle Zahlen sind `[K]`.** Die Elementwerte, Kopplungsstärke, Mutationsdrift, Effektprozente und die Gewichte in `stats.ts` sind nicht abgenommen; die Kampfbalance ist laut `docs/VISUAL_GRUNDSATZ.md` offen. Die Mechanik steht, die Werte nicht — jede Konstantengruppe trägt den Vermerk an der Quelle, an der sie gepflegt wird.

**Der Grund für die Kopplung.** Drei Elemente allein wären drei unabhängige Würfe und damit Zufallsnebel statt Spektrum. In `mutation.ts` zieht jedes Element sein Gegenstück runter — Masse gegen Tempo, Tempo gegen Härte, Härte gegen Masse. Ein Kind kann deshalb nicht „alles stark" sein, und die Kopplung begrenzt sich selbst, weil jede Achse den Wert benutzt, den die vorherige Korrektur hinterlassen hat. `breeding.test.ts` pinnt das als feste Zusage: Über 200 Kinder aus zwei Eltern erreicht **keines** das Elternmaximum auf allen drei Achsen gleichzeitig.

**Die Zuchtkette hat eine feste Reihenfolge und nur eine Zufallsquelle.** `breed` vererbt die Elemente Elternteil für Elternteil, wendet die Kopplung an, mutiert zuletzt und steigert die Generation. Der Seed kommt von außen in den internen PRNG (`deriveSeed` über `createRng`); die Basis-ID geht als Hash hinein, damit dieselbe Basisart gleich mutiert und zwei verschiedene nicht. **`mutate` ersetzt höchstens eine Eigenschaft, und zwar eine, die das Wesen noch nicht führt.** Die erste Fassung zog den Ersatz aus dem gesamten Pool; traf der Zufall den einen bereits vorhandenen Wert, verschwand die Eigenschaft dauerhaft, weil die Deduplizierung danach die Länge kürzte. Gemessen über 500 Seeds verlor ein Genom mit zwei Traits in 19 Fällen einen davon. Der Ersatz nimmt jetzt einen Kandidaten aus der Liste der noch nicht geführten Werte; trägt das Genom alle, wird nichts getauscht. Aus einem Austausch ist damit eine Änderung geworden und keine Reduktion.

**Reihenfolge der Ableitung:** Kopplung aus den Elementen (`stats.ts`), dann Traits, dann Boni (`resolve.ts`). Dass die Boni zuletzt kommen, ist die Regel und kein Zufall: ein `bulwark` auf einem `toughHide`-Monster trägt mehr als auf einem nackten, weil er verstärkt, was der Trait aufgebaut hat.

**Ein Effekt sieht das Genom, nicht nur die Zahlen.** Die Signatur ist `apply(stats, genome)`. `vitality` braucht das: der Bonus liest Element 0 und streckt seinen Zuschlag von 12 % bis 26 % über die Masse, sodass ein Glutkolos spürbar mehr bekommt als ein Schattenläufer. `endurance` bleibt der feste Faktor — genau darin unterscheiden sich die beiden. Vor dieser Änderung war beides ein flacher Multiplikator, während die Kommentare das andere behaupteten.

**Jeder Trait und jeder Bonus ist eine eigene Datei** — `trait-tough-hide.ts` bis `trait-focused.ts`, `bonus-bulwark.ts` bis `bonus-vitality.ts`. Jeder Effekt gibt und nimmt: `keenEdge` schärfer den Angriff und kostet Gesundheit, `bulwark` ist dagegen der reine, schmalse Bonus. Ohne den Gegenwert wäre ein Zucht-Trait eine freie Verbesserung und der Stack beliebig groß. Die Initiative-Grenze und die Cooldown-Grenze stehen an einer Stelle (`effect-kit.ts`), damit nicht drei Effekte drei Schreibweisen derselben Klammermauer aufschreiben.

**Auswertung:** Die Basis-Kampfwerte kommen aus `PROVISIONAL_RULES.monster` statt aus einer zweiten Kopie in `stats.ts`; `genome` liest damit dieselben Ausgangswerte, mit denen der Core rechnet. Der Redundancy-Gate hatte die Dublette zu Recht gemeldet. Der Import geht dabei an `../combat/rules` und nicht an den Barrel — der Barrel zieht den ganzen Kampfgraphen in die Abhängigkeiten, obwohl nur eine Konstante gebraucht wird.

## 2026-09-29 — Placement Tile: der Kostenzuschlag fällt, die Suche wird gleichgewichtig

**Ein KI-Vorschlag hatte eine Falle gebaut, die nie im Scope war.** `CellType.Trap = 2` kostete vier Punkte statt einen, `findPath` suchte mit einem Umwegbudget von fünf Punkten und fiel bei dessen Überschreitung auf den Weg mit den wenigsten Tiles zurück (`trap-fallback`), und der Client zeigte daneben `Umweg` an. Mit der Entscheidung vom 2026-09-29 ist die Zelle eine Platzierungsmarkierung: Sie markiert den Bereich einer Gruppe, macht keinen Schaden und kostet nichts.

**Die Kosten waren der ganze Grund für die Maschinerie.** Ohne Zuschlag sind alle begehbaren Zellen gleich teuer, also ist die Suche eine Breitensuche: `grid/path.ts` hält sie jetzt selbst, mit fester Nachbarreihenfolge, FIFO-Warteschlange und `Int32Array`-Elternzeigern; `path-search.ts` und `min-heap.ts` sind gelöscht, ebenso `manhattan`, das nur Bezugsmaß des Budgets war. `PathMode` kennt nur noch `reachable` und `unreachable`, `PathResult.movementCost` ist `path.length - 1` — vorher zählten Spawn und Boss null, weshalb dieselbe Route 125 statt 126 Punkte meldete.

**Der Golden-Pin blieb wortgleich grün** (`94ba1954`, `f85b31c0`). Das ist der Beleg, den dieser Umbau braucht: Kein Fixture führt eine Platzierungszelle, also musste die neue Suche für diese Raster denselben Weg wählen — und tat es. Für die geänderte Regel steht ein eigener Test in `grid/path.test.ts`: Eine Platzierungszelle auf der geraden Route wird durchschritten und die Route bleibt bei 126 Bewegungspunkten; eine Wand an derselben Stelle macht sie unerreichbar. Ein zweiter Test pinnt, dass zwei Läufe über dasselbe Raster denselben Weg liefern.

**`sim_version 0.0.4`.** Der Pin bewegt sich nicht, weil kein Fixture die Zelle führt — die Regel tut es: Ein unter dem alten Kostenmodell gerechneter Log mit Platzierungszellen ist nicht reproduzierbar. Die drei Traptests in `path.test.ts` und die Fallback-Erwartung in `packages/contracts/test/contracts.test.ts` sind mit der Regel entfallen, `combat/actions.ts` nennt in seinem Kommentar jetzt die Breitensuche statt der gewichteten Suche.

## 2026-09-28 — Die Summary trägt den Verteidiger-Roster

**Scope:** geändert `src/combat/summary.ts` (neues Feld `defendersTotal`). Kein Hash, keine Regel und kein Verhalten geändert — der Golden-Pin bleibt wortgleich grün und belegt das.

`summarizeCombat` füllt jetzt `defendersTotal` aus den Einheiten des Logs: alle Einheiten der Monster-Seite, den Boss eingeschlossen. Damit ist die Zahl der gefallenen Gegner aus einem abgelegten Ergebnis berechenbar, ohne den Kampflog zu laden — `monstersAlive` und `bossAlive` nennen nur die Überlebenden, und `ResultPayloadSchema` trägt den Log nicht. Die Zahl kommt aus derselben Einheitenliste wie die Überlebendenzahlen, es gibt also keine zweite Quelle. Der Anlass des Felds steht im Contract, gerechnet wird damit noch nichts. `combat.test.ts` prüft beide Zusagen gegen die Todesereignisse des Logs statt sie zu glauben: den Pin auf `defendersTotal` und die Identität `defendersTotal - monstersAlive - (bossAlive ? 1 : 0)` gleich der Zahl der gefallenen Verteidiger.

## 2026-09-28 — Golden-Pin des Kampf-Hashes und ein Messwerkzeug für die Siegquoten

**Scope:** neu `src/combat/combat-pin.test.ts` und `src/combat/balance-report.test.ts`. Kein Produktivcode, keine Regel und kein Hash geändert.

**Die Lücke war der Pin, nicht die Abdeckung.** Die Engine-Tests verglichen bisher ausschließlich zwei Läufe miteinander (gleicher Seed, Seed-Sensitivität, Trail, Replay). Eine beiläufige Änderung an Einheiten, Regelwerten oder Event-Reihenfolge wäre damit grün geblieben, solange sie nur deterministisch ist — und hätte den Hash jedes gespeicherten Replays verschoben, ohne dass eine Version steigt. `combat-pin.test.ts` pinnt zwei Läufe absolut, beide Seed 4242, Teamgröße 3: offenes Fixture-Grid mit zwei belegten Plätzen (`94ba1954`, `monsters-win`, 225 Ticks, 417 Ereignisse, 127 Trail-Zellen) und die Umweg-Route mit voller Belegung (`f85b31c0`, `monsters-win`, 401 Ticks, 1010 Ereignisse, 253 Trail-Zellen). Der rote Erstlauf vor dem Eintragen der Werte belegt, dass der Pin greift. Ein roter Lauf ist dann eine Entscheidung — gewollt? Version anheben? Doku nachziehen? —, und die Zahlen werden im selben Commit angepasst.

**Ein Messwerkzeug, kein Sollwert.** `balance-report.test.ts` fährt die Stufenverteilung über Seeds und Verteidigerplätze und druckt sie als Tabelle. Es pinnt bewusst kein gewünschtes Ergebnis: ein Test, der den Ist-Stand als Ziel festschreibt, wäre die Fehlerquelle mit grüner Anzeige. Standardbreite 32 Seeds je Zeile, `BALANCE_SEEDS=500` für eine belastbare Messung. Geprüft wird nur, was gelten muss: jede Stufe ist bekannt, und die Rohzahlen summieren sich je Zeile auf die Seed-Zahl — nicht die gerundeten Prozente, die sich auf 99 bis 101 summieren.

**Befund, 500 Seeds je Belegung bei Teamgröße 3 auf dem offenen Fixture-Grid:** Siegquote 90 % bei null belegten Plätzen, 65 % bei einem, 81 % bei zwei und 0 % ab drei; ein Zeitlimit tritt nicht auf, die mittlere Kampfdauer liegt bei 217 bis 228 Ticks. Die Roadmap-Behauptung „0 % ab drei belegten Verteidigerplätzen" ist damit im Repo reproduziert. Zwei Auffälligkeiten, die keine Regeländerung sind: Die Kurve ist zwischen einem und zwei Plätzen nicht monoton, weil der zweite Platz an Routenposition 900 fast am Boss sitzt und die Zielwahl sich mit der Einheitenliste ändert; und die 2-Platz-Zeile lag bei 200 Seeds bei 84 % und bei 500 Seeds bei 81 %, die Standardbreite ist für Aussagen also zu klein.

## 2026-09-28 — Der Boss bekommt ein Modul, und `monstersAlive` zählt ohne ihn

**Scope:** neu `src/combat/boss.ts`; geändert `src/combat/rules.ts` (Boss-Werte und `bossSpec` ausgezogen), `src/combat/state.ts` (`isBoss` statt Zeichenkettenvergleich), `src/combat/summary.ts` (`monstersAlive` ohne Boss, `bossAlive` über `isBossAlive`), `src/combat/index.ts` (Barrel) und `src/combat/combat.test.ts` (ein neuer Fall). Contracts, Werte und Log-Hash unberührt.

**Der Befund.** `monstersAlive` wurde an zwei Stellen berechnet und uneinig: `summary.ts` zählte über `aliveOnSide(..., 'monsters')` und damit den Boss mit — er trägt `side: 'monsters'` —, während `packages/client/src/raid/timeline-model.ts` ihn in einem eigenen Zweig abzog. Für denselben Log nannten Core und Client verschiedene Zahlen, und beide standen im Bild.

**Die Korrektur.** `boss.ts` ist der neue Owner: `BOSS_ROLE`, `isBoss`, `isBossAlive`, `BOSS_RULES` und `bossSpec`. `rules.ts` importiert `bossSpec` statt ihn zu führen, `state.ts` sucht den Boss mit `states.find(isBoss)`, und `summary.ts` zählt Monster über eine Rolle, die den Boss ausnimmt, während `bossAlive` aus derselben Rollenerkennung kommt. Damit können die beiden Felder nicht mehr auseinanderlaufen. Boss-exklusive Verstärkungen haben jetzt einen Platz, statt als dritter Monsterwert in `PROVISIONAL_RULES` zu liegen.

**Was sich nicht ändert.** Werte, IDs, Reihenfolge und Spec-Form sind unverändert; der Kampf-Hash bleibt gleich. `combat.test.ts` pinnt den neuen Fall mit abgeschaltetem Tick-Limit: zwei Monster, ein Boss, `monstersAlive === 2`, `bossAlive === true`.

Die Einträge vom 2026-09-27 zur längsten Route und zum Review der Kernannahmen stehen wortgleich in `packages/sim-core/docs/historisch/2026-09-27_changelog-laengste-route.md` und `2026-09-27_changelog-kernannahmen-review.md`; sie sind unverändert erhalten.
