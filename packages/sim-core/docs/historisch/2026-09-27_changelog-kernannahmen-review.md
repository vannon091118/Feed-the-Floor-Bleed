# packages/sim-core/docs/historisch/2026-09-27_changelog-kernannahmen-review.md

Aus `packages/sim-core/docs/CHANGELOG.md` ausgelagert am 2026-09-29, weil die aktive Datei an ihre 200-Zeilen-Grenze stiess. Wortgleich übernommen.

## 2026-09-27 — Review der Kernannahmen: Saatindex abgeleitet, Mantissengrenze gepinnt, Streuung getestet

**Scope:** geändert `src/combat/actions.ts`, `src/combat/combat.test.ts`, `src/grid/path-search.ts`, `src/math/fixed.ts` und `src/math/math.test.ts`. Contracts, Verhalten und Hashes unberührt.

Ein Review der Kernannahmen hat fünf Punkte gemeldet. Drei betrafen Code und sind nachgezogen, zwei waren Beobachtungen: Der Saatindex kodierte Takt und Routenschritt als `tick * 4096 + routeIndex`, die 4096 kam aber nirgendwo her. Sie ist die Zahl der Rasterzellen, der Faktor heißt jetzt `ROUTE_SLOTS = GRID_SIZE * GRID_SIZE` und ein größeres Raster zieht ihn mit; die Annahme dahinter — eine Route betritt keine Zelle zweimal und hat damit höchstens so viele Schritte wie das Raster Zellen — steht als Kommentar an der Konstanten. Das gemeldete Raster von 128×128 trifft nicht zu: `GRID_SIZE` ist 64, es gibt 4096 Zellen, und `buildCombatUnits` leitet jeden `routeIndex` aus `routeLength - 1` ab.

`mulFixed` trägt jetzt seine Genauigkeitsgrenze. Das Produkt darf über der Mantissengrenze 2^53 liegen, weil die Multiplikation relativ rundet und `FIXED_SCALE` den Fehler anschließend teilt; erst ab einem Ergebnis dieser Größe weicht das Ganzzahlergebnis ab. Die Combat-Werte liegen bei 1,6e4 mal 1e3, also elf Größenordnungen darunter, und `math.test.ts` pinnt beide Seiten der Grenze. Ein Wurf bei Überschreitung wäre ein Wächter für Eingaben, die heute niemand erzeugen kann.

`manhattan` war im Review als ungenutzte Heuristik gelesen worden. Es ist der Bezugsabstand für das Umwegbudget in `findPath` und kein Schätzterm der Suche — `search` bleibt vollständiges Dijkstra; ein Kommentar an der Funktion sagt das jetzt, damit die nächste Lesung nicht wieder darüber stolpert.

`damageFor` ist neu testgedeckt: Normalfall, negative Streuung und Verteidigung über dem Angriff. `variancePermille` ist im Contract ein freies Ganzzahlfeld, negativ also erlaubt, und beide Randfälle enden auf `damageFloor` — negativer Schaden kann nicht entstehen.

Zwei der fünf Punkte waren Fehlannahmen und brauchen keinen Code. Die Vermutung, `mulFixed` breche den Determinismus über Plattformgrenzen, trifft nicht zu: `*`, `/` und `Math.trunc` sind IEEE-Operationen und auf jeder konformen Engine bitgleich, und oberhalb der Mantissengrenze ist das Ergebnis falsch, aber nicht verschieden — nachgemessen weicht `mulFixed(9007199254740994, 1001)` um genau 2 vom exakten `9016206453995734` ab. Und die acht leeren Namespaces (`sim-core/genome`, `ghost`, `items`, `client/net`, `storage`, `inventory`, `server/matchmaking`, `sync`) enthalten nur `.gitkeep` und stehen bereits als nicht implementiert in `docs/CONCEPT_REVIEW.md` und `docs/ROADMAP.md`; die Pflichtdoku war dort schon richtig, also kein Delta.

> **Überholt am 2026-09-29:** Dieser Absatz führt `genome` unter den leeren Namespaces mit nur `.gitkeep`. Die Domäne ist an diesem Tag gebaut worden; `ghost`, `items`, `client/net`, `storage`, `inventory`, `server/matchmaking` und `sync` bleiben leere Namespaces.

Der Kommentar an `ROUTE_SLOTS` nennt jetzt zusätzlich den Mechanismus hinter der Annahme: das `closed`-Feld in `search` verhindert, dass eine Zelle erneut expandiert wird. Genau dieses fehlende Bindeglied war der Anlass des Befunds, obwohl die Annahme selbst nie falsch war.

**Nicht geändert:** Der Determinismus steht nicht zur Debatte. `*`, `/` und `Math.trunc` sind IEEE-Operationen und liefern auf jeder konformen Engine dasselbe Ergebnis; ein Genauigkeitsverlust wäre ein falscher, aber kein plattformabhängiger Hash. Die leeren geplanten Domänen (`genome`, `ghost`, `items`, `net`, `storage`, `inventory`, `matchmaking`, `sync`) sind in `docs/CONCEPT_REVIEW.md` als nicht implementiert und in `docs/ROADMAP.md` als T2/T3 geführt.

> **Überholt am 2026-09-29:** Dieser Absatz nennt `genome` unter den leeren Namespaces. `packages/sim-core/src/genome/` ist an diesem Tag gebaut worden (20 Basis-Monster, Traits und Boni, gekoppelte Mutation). `items`, `ghost`, `net`, `storage`, `inventory` und `matchmaking` sind weiterhin leere Namespaces.

**Die Eintraege vom 2026-09-25 und vom 2026-09-26 sowie die beiden 2026-09-27-Blöcke sind nach `packages/sim-core/docs/historisch/` gewandert** (`2026-09-25_changelog-dungeon-kern.md`, `2026-09-25_changelog-trail-hash.md`, `2026-09-26_changelog-review-nachgang-t1-1.md`, `2026-09-27_changelog-divfixed-grenze.md` und `2026-09-27_changelog-rasterexport-und-stufenpruefung.md`), weil diese Datei an ihre Zeilengrenze stiess. Sie sind unveraendert erhalten.
