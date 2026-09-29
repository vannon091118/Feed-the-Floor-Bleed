# packages/sim-core/docs/CHANGELOG.md

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

## 2026-09-27 — `divFixed` trägt seine Genauigkeitsgrenze und hat einen Test

**Scope:** geändert `src/math/fixed.ts` und `src/math/math.test.ts`. Kein Produktionsaufrufer, kein Verhalten geändert.

`mulFixed` trug seine Mantissengrenze, `divFixed` nicht. Die Grenze liegt hier aber woanders: Genau ist die Division, solange der Zähler `left * FIXED_SCALE` genau darstellbar bleibt, also bis `|left| = 2^53 / FIXED_SCALE` (rund 9,0e12), und nicht erst beim Ergebnis. Darunter greifen drei Dinge zusammen: der Zähler ist exakt, der Quotient bleibt ganzzahlig darstellbar, und weil der wahre Wert mindestens `1 / right` von der Trunkierungsgrenze entfernt liegt, kann die korrekt gerundete Division ihn nicht über eine Ganzzahl hinwegschieben. Oberhalb rundet schon der Zähler um bis zu eine halbe ulp, und das Ergebnis wird falsch — nachgemessen um 1 bei `divFixed(9007199254740994, 1001)` und um 170 bei `divFixed(2 ** 53, 3)`. Deterministisch bleibt es, genau nicht.

`math.test.ts` pinnt beide Seiten der Grenze: die größte exakte Größe in beiden Vorzeichen, einen Fall in Combat-Größenordnung und einen Fall jenseits der Grenze, der die exakte Zahl nicht mehr trifft. `divFixed` hat weiterhin keinen Produktionsaufrufer; die Doku steht, bevor einer entsteht.

## 2026-09-27 — Die längste Route ist getestet, nicht nur kommentiert

**Scope:** neu `carveFullWidthRoute` und ein Fall in `src/grid/path.test.ts`. Produktivcode, Contracts, Hashes und Simulationsverhalten unberührt.

Die Annahme an `ROUTE_SLOTS` stand bisher nur als Kommentar: Eine Route betritt keine Zelle zweimal und hat damit höchstens so viele Schritte wie das Raster Zellen. `carveFullWidthRoute` baut den Korridor, der das prüft — alle geraden Zeilen offen, verbunden an abwechselnden Enden —, und weil jede weitere offene Zelle eine Abkürzung wäre, ist der vollständige Durchlauf die längste Route, die sich in einem 64×64-Raster erzwingen lässt: 32 Durchquerungen der vollen Breite, zusammen 2080 Zellen und 2079 Schritte. Der Test läuft sie ab und hält ihre Länge gegen `grid.cells.length`, womit auch der größte `routeIndex` von 2079 unter dem Trenner 4096 bleibt. Der Boss muss dafür ans linke untere Ende, weil der Zickzack nach 32 Verbindern dort ankommt; das Raster entsteht deshalb mit explizitem Spawn und Boss statt mit den Vorgaben (0|0) und (63|63).

## 2026-09-27 — Ungenutzter Rasterexport entfernt, Stufenprüfung verkürzt

**Scope:** geändert `src/grid/grid.ts` und `src/combat/state.ts`. Contracts, Hashes und Simulationsverhalten unberührt.

`gridSize()` in `src/grid/grid.ts` hatte keinen Aufrufer; der Export ist entfernt. In `src/combat/state.ts` ist `!boss || !boss.alive` zu `!boss?.alive` geworden — dieselbe Aussage, weil ein fehlender Boss kurzschließt und der zweite Vergleich dann ohnehin wahr ist. Anlass war die Umstellung von `pnpm run -s lint` auf `biome check --error-on-warnings` und der jetzt vollständige Typecheck der Testverzeichnisse, die beide Symbole vorher nicht sahen.

## 2026-09-27 — Review der Kernannahmen: Saatindex abgeleitet, Mantissengrenze gepinnt, Streuung getestet

**Scope:** geändert `src/combat/actions.ts`, `src/combat/combat.test.ts`, `src/grid/path-search.ts`, `src/math/fixed.ts` und `src/math/math.test.ts`. Contracts, Verhalten und Hashes unberührt.

Ein Review der Kernannahmen hat fünf Punkte gemeldet. Drei betrafen Code und sind nachgezogen, zwei waren Beobachtungen: Der Saatindex kodierte Takt und Routenschritt als `tick * 4096 + routeIndex`, die 4096 kam aber nirgendwo her. Sie ist die Zahl der Rasterzellen, der Faktor heißt jetzt `ROUTE_SLOTS = GRID_SIZE * GRID_SIZE` und ein größeres Raster zieht ihn mit; die Annahme dahinter — eine Route betritt keine Zelle zweimal und hat damit höchstens so viele Schritte wie das Raster Zellen — steht als Kommentar an der Konstanten. Das gemeldete Raster von 128×128 trifft nicht zu: `GRID_SIZE` ist 64, es gibt 4096 Zellen, und `buildCombatUnits` leitet jeden `routeIndex` aus `routeLength - 1` ab.

`mulFixed` trägt jetzt seine Genauigkeitsgrenze. Das Produkt darf über der Mantissengrenze 2^53 liegen, weil die Multiplikation relativ rundet und `FIXED_SCALE` den Fehler anschließend teilt; erst ab einem Ergebnis dieser Größe weicht das Ganzzahlergebnis ab. Die Combat-Werte liegen bei 1,6e4 mal 1e3, also elf Größenordnungen darunter, und `math.test.ts` pinnt beide Seiten der Grenze. Ein Wurf bei Überschreitung wäre ein Wächter für Eingaben, die heute niemand erzeugen kann.

`manhattan` war im Review als ungenutzte Heuristik gelesen worden. Es ist der Bezugsabstand für das Umwegbudget in `findPath` und kein Schätzterm der Suche — `search` bleibt vollständiges Dijkstra; ein Kommentar an der Funktion sagt das jetzt, damit die nächste Lesung nicht wieder darüber stolpert.

`damageFor` ist neu testgedeckt: Normalfall, negative Streuung und Verteidigung über dem Angriff. `variancePermille` ist im Contract ein freies Ganzzahlfeld, negativ also erlaubt, und beide Randfälle enden auf `damageFloor` — negativer Schaden kann nicht entstehen.

Zwei der fünf Punkte waren Fehlannahmen und brauchen keinen Code. Die Vermutung, `mulFixed` breche den Determinismus über Plattformgrenzen, trifft nicht zu: `*`, `/` und `Math.trunc` sind IEEE-Operationen und auf jeder konformen Engine bitgleich, und oberhalb der Mantissengrenze ist das Ergebnis falsch, aber nicht verschieden — nachgemessen weicht `mulFixed(9007199254740994, 1001)` um genau 2 vom exakten `9016206453995734` ab. Und die acht leeren Namespaces (`sim-core/genome`, `ghost`, `items`, `client/net`, `storage`, `inventory`, `server/matchmaking`, `sync`) enthalten nur `.gitkeep` und stehen bereits als nicht implementiert in `docs/CONCEPT_REVIEW.md` und `docs/ROADMAP.md`; die Pflichtdoku war dort schon richtig, also kein Delta.

Der Kommentar an `ROUTE_SLOTS` nennt jetzt zusätzlich den Mechanismus hinter der Annahme: das `closed`-Feld in `search` verhindert, dass eine Zelle erneut expandiert wird. Genau dieses fehlende Bindeglied war der Anlass des Befunds, obwohl die Annahme selbst nie falsch war.

**Nicht geändert:** Der Determinismus steht nicht zur Debatte. `*`, `/` und `Math.trunc` sind IEEE-Operationen und liefern auf jeder konformen Engine dasselbe Ergebnis; ein Genauigkeitsverlust wäre ein falscher, aber kein plattformabhängiger Hash. Die leeren geplanten Domänen (`genome`, `ghost`, `items`, `net`, `storage`, `inventory`, `matchmaking`, `sync`) sind in `docs/CONCEPT_REVIEW.md` als nicht implementiert und in `docs/ROADMAP.md` als T2/T3 geführt.

## 2026-09-26 — Review-Nachgang T1.1: toter Trail-Vergleich, Lint und Wrapper

- `src/combat/replay.ts`: `verifyCombatLog` enthielt nach T1.1 einen Längen- und Zellvergleich des Trails. Der war wirkungslos, weil `replayCombat` `log.trail` unverändert an `simulateCombat` durchreicht und der Vergleich damit jedes Element mit sich selbst verglich — der Block konnte nie `false` liefern. Er ist entfernt; der Trail bleibt über `fingerprintCombatLog` im Hash abgesichert.
- `src/combat/fingerprint.ts`: der Ein-Aufruf-Wrapper `trailHash` ist entfernt, der Ausdruck steht direkt in der Schleife. `let hash` wich `const`, der zuvor rote Biome-Lauf ist damit grün.
- Die frühere Zeile „`verifyCombatLog` prüft Länge und jede Zelle“ war falsch und ist durch diesen Eintrag überholt.

## 2026-09-25 — T1.1 Trail-Hash: `trail` fließt in den Hash, LOC-Cap gehalten

- `src/combat/types.ts`: `CombatTrailEntry { x, y, cell }` und `CombatLog.trail: CombatTrailEntry[]` neu.
- `src/combat/fingerprint.ts`: `trailHash` neu, `fingerprintCombatLog` hasht jede Trail-Zelle vor Units und Events — gleich lange Routen unterscheiden sich.
- `src/combat/resolve.ts`: baut `trail` aus `findPath(grid)` plus `getCell`, reicht ihn an `simulateCombat`.
- `src/combat/simulate.ts`/`replay.ts`: `trail` ist Pflicht-Input, `verifyCombatLog` prüft Länge und jede Zelle.
- `packages/client/test/raid-job.test.ts`: bekannte Lücke geschlossen, Test von `toBe` auf `not.toBe` gedreht (bewusst roter Durchlauf vor dem Fix belegt).

## 2026-09-25 — Kommentar- und Doku-Typos in Grid und Combat

- `src/grid/serialize.ts`: der Brücken-Kommentar sprach davon, dass ein eingefrorener Snapshot „hinterher“ nicht verändert werden kann. Gemeint war „nachträglich“; hinterher im Sinne von Zeitfolge ergibt hier keinen Sinn.
- `src/combat/fixture-job.test.ts`: der Testname sprach davon, den Kampf-Timeout „als erfolgreiches Ergebnis“ zu behandeln. Der Auftrag ist erfolgreich abgeschlossen, das Ergebnis darin trägt die Stufe `timeout`. Beides ist jetzt im Namen getrennt.
- `docs/STRINGMATRIX.md`: die Hard-Block-Zeile nannte die Regel „Letzte freie Route nicht zumauerbar“. Die Form existiert im Deutschen nicht; die Regel lautet jetzt, dass die letzte freie Route nicht zugemauert werden darf.

## 2026-09-25 — T1.3 Ergebnislog und lokale Fixture-Job-Ausführung

- `src/grid/serialize.ts` ergänzt: `toDungeonGrid` und `fromDungeonGrid` als Brücke zwischen Contract-Payload (`cells` als Array) und Laufzeit-Grid (`Uint8Array`), jeweils kopierend und mit Zellzahl-Prüfung.
- `src/combat/summary.ts` ergänzt: `summarizeCombat` verdichtet den Log zu Stufe, Ticks, Hash, Ereignis- und Angriffszahlen, Schaden und Überlebenden. Die Summary wird gegen den Contract geparst.
- `src/combat/resolve-snapshot.ts` ergänzt: `resolveSnapshotRaid` liefert aus Grid und Aufstellung ein `ResultPayload` und ein `RaidLogPayload`. Der Envelope sitzt erst hier — die Engine kennt weiterhin keine Protokollversion.
- `src/combat/fixture-job.ts` ergänzt: `runFixtureRaid` führt einen Auftrag lokal und ohne Uhr aus. `createdAt`/`observedAt` werden übergeben, nicht gelesen. Rückgabe ist ein durch `RaidJobSchema` validierter Auftrag.
- Der Runner prüft die Auftragsfrist (`expired`/`timeout`), die Route (`blocked`), das Upload-Schema (`invalid-request`) und replayt den geparsten Log, bevor er `completed` meldet (`invalid-hash` bei Abweichung).
- Der Kampf-Timeout bleibt ein erfolgreiches Ergebnis mit `stage: 'timeout'`; er ist damit vom Auftrags-Timeout getrennt.
- 8 neue Tests in `src/combat/fixture-job.test.ts` decken Ergebnis, Roundtrip, Log-Artefakt, Fehler, Auftrags-Timeout, Kampf-Timeout und Block ab.
- Der Test baut seinen Upload bewusst selbst und importiert keine Fremd-Domain-Fixture: das Modularity-Gate verbietet das Verlassen des eigenen Packages.

## 2026-09-25 — T1.2 deterministischer Combat-, Hash- und Replay-Core

- `math` implementiert Fixed-Point (Skala 1000) mit `mulFixed`, `divFixed`, `clampInt`, `absInt` sowie `isqrt`/`sqrtFixed` ohne `Math.sqrt`.
- `prng` implementiert Mulberry32 (`createRng`, `nextUint32`, `nextBelow`, `nextRange`) und `deriveSeed(seed, index, salt)` für Sub-Streams pro Aktion.
- `hash` implementiert eine FNV-1a-Kette über Wörter und Text als deterministischen Log-Fingerprint.
- `combat` implementiert die bounded Tick-Simulation mit deterministischer Zielwahl, Seed-Varianz pro Angriff, Event-Log, kanonischem Hash und Replay über `resolveCombat`, `simulateCombat`, `replayCombat` und `verifyCombatLog`.
- Balancing-Werte liegen provisorisch und zentral in `src/combat/rules.ts`; sie sind nicht abgenommen (`[K]` in `docs/CONCEPT_REVIEW.md`).
- 20 neue Tests decken Fixed-Point, PRNG, Hash, Determinismus, Seed-Sensitivität, Replay, Tick-Limit, Team-/Slot-Grenzen und den Hard-Block ohne Route ab.

## 2026-09-25 — Fallback zurück auf wenigste Tiles

- Der Fallback-Suchpfad optimiert wieder Minimalschritte (wenigste Tiles), nicht Minimalkosten; die frühere Umkehrung war nicht durch das ODT-Konzept gedeckt.
- `packages/sim-core/src/grid/path.ts` nutzt damit auch im Fallback `steps-first`.
- Golden-Test in `packages/sim-core/src/grid/path.test.ts` dreht die Erwartung: Bei Budget-Überschreitung wählt die Gruppe die Trap-Route mit 126 Steps / 131 Kosten statt des Umwegs mit 128 Steps / 127 Kosten.

## 2026-09-25 — Fallback-Ordering korrigiert

- Der Fallback-Suchpfad optimiert jetzt Minimalkosten statt Minimalschritte; Steps-First bleibt nur für das Budget-Limit-Search erhalten.
- Golden-Test verankert: Trap-Route mit 131 Kosten vs. Umweg-Loop mit 127 Kosten — der Fallback wählt die günstige Route.

## 2026-09-25 — Erster Dungeon-Core

- 64×64-Logikgrid mit fünf Tile-Typen, Spawn/Boss und 4×4-Logikzellen pro sichtbarem Tile in einer 16×16-Tile-Aufteilung implementiert.
- Deterministische A*-Routensuche mit Trap-Kosten, +5-Bewegungsbudget, Fallback durch Fallen und Hard-Block implementiert.
- Sieben Golden-Tests für Routing, Budget, Fallback, Unerreichbarkeit und Grid-Validierung ergänzt.

## 2026-09-25 — Init

- Domäne angelegt: `src/prng`, `src/math`, `src/grid`, `src/combat`, `src/genome`, `src/items`, `src/hash`, `src/ghost`.
- Hygiene-Skelett erfüllt. Determinismus-Regeln aktiv (kein Math.random/Date/sin/pow/sqrt).
