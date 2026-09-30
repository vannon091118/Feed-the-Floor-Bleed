# packages/sim-core/docs/CHANGELOG.md

## 2026-09-30 — Der Trail-Hash hat den Kampf verkauft, und der Lebensvergleich hat gerundet

**Scope:** geändert `src/hash/fnv1a.ts` (`hashWord`), `src/combat/state.ts` (`livesAhead`, `livesBehind`), `src/combat/combat-pin.test.ts` (sechste Verschiebung, zwei Hash-Werte) und `src/hash/hash-kappung.test.ts` (aus einem Beweis für den Fehler zu vier Fällen dagegen). Geändert `src/version.ts` in `contracts`, dort `sim_version 0.0.9 → 0.0.10`. `CONTRACT_VERSION` bleibt 9 — die Form des Wire-Formats ändert sich nicht, nur der Wert des Hash-Feldes. Kein Migration-SQL, weil kein Feld entsteht oder verschwindet.

**`hashWord` nahm `>>> 0` und mischte danach vier feste Bytes.** Eine Zahl und dieselbe Zahl plus 2³² lieferten denselben Beitrag, also denselben Hash. Da `specHash` und `eventHash` genau das mit `maxHp`, `attack`, `amount` und den übrigen Kampfzahlen tun, konnten **zwei verschiedene Kämpfe denselben Fingerprint tragen** — und `verifyCombatLog` acceptierte den zweiten, weil der Hash stimmte. Das war Formerlaubnis mit Maske, kein Rundungsfehler.

**Der Beitrag wandert jetzt über alle Bytes der Zahl**, mit dem Vorzeichen als eigenem Byte, damit `-1` nicht wie `0` auf derselben Bahn läuft. Vier Tests in `hash-kappung.test.ts` verbieten die Kollision jetzt; der wichtigste fiel vorher **grün** und fällt erst seit diesem Commit.

**Was das nicht behebt, gehört in denselben Satz:** Der Zustand bleibt 32 Bit, und das Wire-Format bleibt bei acht Hex-Stellen. Ein Geburtstagsangriff auf den Fingerprint bleibt damit möglich. Beseitigt ist die rechnerische Vorschrift, die Formerlaubnis trug — nicht die Wahl der Länge.

**Der Lebensvergleich lief über ein Kreuzprodukt.** `livesAhead` und `livesBehind` verglichen `candidate.hp * best.maxHp > best.hp * candidate.maxHp`. Das ist mathematisch richtig und praktisch eine Zeitbombe: `Number` verliert ab 2⁵³ genau, zwei Werte um je 9 007 199 254 740 992 gelten als gleich groß. **Ab `maxHp ≈ 3 001 199` entschied der Kampf in diesem Vergleich nicht mehr das Leben, sondern die Rundung** — bei exponentiellem Levelwachstum also rund bei Level 25. Geteilt wird jetzt durch das jeweilige `maxHp`. Die alte Fassung wollte die Rundung vermeiden und hat sie nur verlegt.

**Der Pin ist der Zeuge, dass sonst nichts kaputt ging.** Nur die Hash-Werte wandern: `261cd39a → 092932b7` und `ee21afc5 → a49899d7`. Ticks 196, 396 Ereignisse, 127 Trail-Einträge, `heroes-win` auf dem offenen Grid und `monsters-win` nach 166 Ticks auf der Umweg-Route bleiben zeichengleich wie am 2026-09-29. Wäre auch nur ein Tick gefallen, hätte der Eingriff den Kampf berührt statt nur seine Unterschrift.

**Belegt durch** 544 Tests in 82 Dateien, typecheck 0, lint 0, LOC-Caps ok, Hygiene ok und Shinon PASS.

## 2026-09-30 — Die Summary rechnet aus, wer den Schaden verursacht hat

**Scope:** geändert `src/combat/summary.ts` (die Bilanz je Einheit), neu `src/combat/summary-damage.test.ts` (sechs Fälle). Kein Verhalten im Kampf, kein Hash, kein Contract-Sprung. `client` und `contracts` tragen die Folge in ihren Test-Fixtures nach.

**Die Lücke war eine Frage, die niemand stellen konnte.** `damage` wurde über alle `attack`-Events summiert, und die Einheit, die den Schaden verursacht hat, ging verloren. Für die Überlebendenzahlen war das richtig — sie zählen, wer noch lebt. Für die Erfahrung ist es die falsche Aggregation: Ein Wesen erfahrnt nach dem Schaden, den es angerichtet hat, und das auch dann, wenn es dabei stirbt. Der Verursacher stand die ganze Zeit im Log, in `actorId`; er war nur nicht ausgewertet.

**Jede Einheit erscheint, auch mit null** — eine Liste nur der Treffer wäre kürzer, aber sie beantwortet die Frage nicht, die die Erfahrung braucht. **Die Reihenfolge kommt aus dem Sortieren**, nicht aus der Eventfolge: Sonst wäre die Zusage „dieselbe Eingabe ergibt dieselbe Summary" an eine Implementierungsentscheidung gebunden statt an die Daten.

**Beleg:** 540 Tests in 81 Dateien (+6), typecheck 0, Lint 0, Shinon PASS. Der Golden Pin ist unberührt (`261cd39a`, `ee21afc5`): Die Änderung liest den Log, sie schreibt ihn nicht.

## 2026-09-30 — Ein Kommentar versprach ein Bild, das kein Renderer kennt

**Scope:** geändert `src/combat/rules.ts` (nur der Kommentar an `monsterSpec`). Kein Verhalten, kein Contract, kein Hash, keine Zahl. Quelle ist der Wahrheits-Audit-Commit `9394880`, der auf einem gelöschten Branch lag und nicht in `main` war.

**Der Kommentar behauptete mehr, als gebaut ist.** `monsterSpec` ließ eine unbekannte Art „als Wesen unbekannt im Bild stehen, statt sie abzubrechen". Kein Renderer kennt diese Zeichenfolge: ein Durchlauf über `packages/client/src` findet keinen Treffer, und `ui/actor-label.ts` fällt für eine unbekannte Art auf `${kind} ${index}` zurück. Der Platzhalter trägt die Basiswerte aus `UNIT_BASE.monster` und verhindert, dass ein veralteter Snapshot die Expedition abbricht — das ist der belegte Grund, und er steht jetzt da.

**Beleg:** der Durchlauf über `packages/client/src` (kein Treffer für die Zeichenfolge) und `ui/actor-label.ts:13`; typecheck 0, 534 Tests in 80 Dateien, Lint 0.

## 2026-09-30 — Vier Funktionen mit nur einem Aufrufer fallen, und vier Exporte ziehen sich auf ihr Modul zurück

**Scope:** geändert `src/math/fixed.ts` (`divFixed` entfällt), gelöscht `src/math/isqrt.ts` (mit `sqrtFixed` verliert `isqrt` seinen letzten Leser), `src/math/index.ts` (Barrel), `src/math/math.test.ts` (drei Fälle fallen mit ihnen), `src/grid/grid.ts` (`visibleTileCount` und `logicCellsPerVisibleTile` entfallen), `src/grid/types.ts` (`PathMode` intern), `src/grid/path.test.ts` (dieselbe Aussage hängt an den Konstanten), `src/hash/fnv1a.ts` (`HASH_OFFSET` intern), `src/genome/registry.ts` (`baseMonsterCount` entfällt), `src/genome/index.ts` und `src/genome/genome.test.ts` (dieselbe Aussage über `baseMonsters().length`), `src/combat/boss.ts` (`BOSS_ROLE` und `BOSS_RULES` intern, Werte unangetastet). Kein Contract, kein Log-Hash.

**Der Befund war Reichweite, nicht Fehlerhaftigkeit.** `divFixed`, `sqrtFixed`, `isqrt`, `baseMonsterCount`, `visibleTileCount` und `logicCellsPerVisibleTile` hatten je genau einen Aufrufer: ihren eigenen Test. Die beiden Zählfunktionen waren zusätzlich eine zweite Zugriffsform auf `VISIBLE_TILE_SIZE` und `LOGIC_CELLS_PER_VISIBLE_TILE`, die beide schon exportiert sind. `HASH_OFFSET`, `PathMode`, `BOSS_ROLE` und `BOSS_RULES` sind weiter im Einsatz, aber nur im eigenen Modul: ihr `export` versprach einen Leser, den es nicht gab.

**Der Nachscan nach dem Schnitt findet keinen weiteren Fall.** Ein Durchlauf über `src/` und `test/` beider Pakete sucht jeden exportierten Namen, der außerhalb seiner Datei keinen Leser hat; übrig bleiben ausschließlich Props- und Typdeklarationen, die strukturell benutzt werden, und `[K]`-Konstanten, die ihr eigenes Modul liest. Ein Export, dessen einziger Leser sein eigener Test ist, existiert danach nicht mehr.

**Die Grenze, an der ein Export bleibt.** Ein Helfer bleibt exportiert, wenn sein Test eine Eigenschaft pinnt, die der exportierte Wrapper nicht ausdrücken kann. `mix32`, `nextUint32` und `FIXED_SCALE` sind deshalb unangetastet. Wo der Test dagegen nur die eigene Arithmetik wiederholte, ist er mit seiner Funktion gefallen; wo die Aussage auch über den verbleibenden Pfad zu haben war, ist sie dorthin gewandert.

## 2026-09-29 — Der Boss war die Wand, und der erste gewonnene Lauf

**Scope:** geändert `src/combat/boss.ts` (`BOSS_RULES` 200000/16000/5000/700 → 132000/12000/1000/500) und `src/combat/combat-pin.test.ts` (beide Pins, plus der Vermerk zur fünften Verschiebung). Keine neue Mechanik, kein Contract.

**Der Spielstand davor hatte keinen Siegzustand.** Gemessen mit 32 Seeds je Verteidigerplatz: das Dreierteam gewann in **0 von 32 Läufen** — und zwar auch dann, wenn gar kein Platzmonster aufgestellt war, also allein gegen den Boss. Das Dreierteam hatte zusammen 144000 Leben gegen 200000 Boss-Gesundheit, und die Rüstung 5000 drückte jeden Heldenangriff von 12000 auf rund 4070. Der Kampf lief dabei bis zum Ende: 208 von 1800 Ticks, im Nahkampf auf Trail-Index 83/84. Es war keine Wegführungs- und keine Zeitfrage, es war eine Größenordnung.

**Die Heldenbasis war unschuldig, und das kostete einen Slice.** Eine Senkung von `UNIT_BASE.hero` und `UNIT_BASE.monster` auf 48/10/2/420 und 32/7/2/260 änderte an der Siegquote **nichts** (0 von 32 vor wie nachher, auch nicht bei doppelter Heldenstärke mit 96000/18000) und verschob trotzdem beide Golden-Pins. Sie wurde zurückgenommen: eine Zahl, die keinen Lauf entscheidet, ist Arbeit ohne Spielwirkung.

**Was jetzt gilt, ist gemessen.** 48 Seeds je Verteidigerplatz:

| Plätze | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| 3 Helden | 100 % | 100 % | 100 % | **88 %** | 0 % | 0 % |
| 4 Helden | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |

Der Referenzkampf aus `docs/CONCEPT_REVIEW.md` Abschnitt 0b — drei Helden gegen Boss plus drei Platzmonster — liegt damit bei 88 % und im Band 80–95 %. Die verbleibende Wand zwischen drei und vier Plätzen ist der Hebel der Teambeschaffung: eine voll bestückte Etage braucht vier oder fünf Helden, und Abschnitt 2 gibt genau diese Grenze her.

**Der erste Pin ist zum ersten Mal ein gewonnener Lauf.** Auf dem offenen Fixture-Grid mit zwei Plätzen kippt `monsters-win` auf `heroes-win`, 216 → 196 Ticks und 413 → 396 Ereignisse. Der zweite Lauf bleibt `monsters-win` und verliert genau ein Ereignis. Fünfte Verschiebung: `sim_version 0.0.8→0.0.9`; `CONTRACT_VERSION` bleibt 9 und es gibt keine Migration, weil sich die Form des Wire-Formats nicht ändert, nur eine Zahl der Simulation.

## 2026-09-29 — Die Nachwirkung bekommt ihren ersten Leser, und sie steht im Spec

**Scope:** neu `src/combat/conditions.ts` und `src/combat/conditions.test.ts`; geändert `src/combat/rules.ts` (`heroSpec` nimmt eine Bedingung, `BuildUnitsInput.team?`), `src/combat/resolve.ts` (`ResolveCombatInput.team?`), `src/combat/resolve-snapshot.ts` (`SnapshotRaidInput.team?`), `src/combat/fixture-job.ts` (`team: parsed.data.activeTeam`) und `src/combat/index.ts` (Barrel). Keine neue Kampfzahl, kein Contract, kein Hash.

**Der Transport war geschlossen, der Konsument fehlte.** `temporaryFatigue` und `temporaryInjury` stehen seit dem ersten Raid-Freeze als Pflichtfelder am `activeTeam`, und der Core hat sie bis hierhin nie gelesen. `fixture-job.ts` gibt sie jetzt an `resolveSnapshotRaid` weiter — es ist der erste Aufrufer im Repo, der dieses Feld überhaupt benutzt —, und `rules.ts` rechnet sie über `heroInitiative` in die Initiative: eine Wunde kostet 20 %, eine Stufe Erschöpfung 10 %, **verkettet** statt addiert (zwei Wunden 36 % statt 40 %), je Stufe gekappt bei fünf; die Werte sind `[K]` und stehen mit ihrem Vermerk an der Quelle in `conditions.ts`. Der Wert reist durch `heroSpec` in `CombatUnitSpec.initiative` und nicht in ein Feld daneben, weil `specHash` die Einheit vollständig hasht und ein Replay nur den Log liest: eine geminderte Initiative, die nur im Speicher läge, wäre im Replay nicht vorhanden. `team` ist durchweg optional und fehlt in den reinen Engine-Aufrufen (Golden-Pin, Balancemessung) — dort kämpft das Team unversehrt, und deshalb bleiben `98cd6dda` und `ebbe2010` Zeichen für Zeichen stehen. Belegt ist die Naht in `conditions.test.ts`: Einzel- und Kettenrechnung ((1,0) 400, (1,1) 360, (2,0) 320), die Kappung ((5,0) gleich (50,0)) und derselbe `resolveCombat`-Aufruf mit und ohne Bedingung, gefiltert auf `role === 'hero'`, weil der Boss auf Routenposition 0 sitzt. **Gates:** typecheck 0, 530 Tests in 78 Dateien, Lint 0, LOC-Caps ok, Hygiene ok.

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
