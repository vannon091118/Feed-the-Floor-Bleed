# docs/CHANGELOG.md — Global

## 2026-09-29 — Zwei Changelog-Einträge behaupteten eine leere Domäne, die inzwischen gebaut ist

**Ein Befund aus der Kontextsammlung, kein Feature.** Zwei Absätze im aktiven `packages/sim-core/docs/CHANGELOG.md` führen `genome` unter den leeren Namespaces, die nur `.gitkeep` enthielten. Das war am 2026-09-26 richtig und wurde am selben Tag später falsch, als die Domäne gebaut wurde. Historische Einträge sind append-only und werden nicht umgeschrieben, deshalb tragen beide Absätze jetzt einen Überholt-Vermerk mit Datum und dem, was tatsächlich noch leer ist: `ghost`, `items`, `client/net`, `storage`, `inventory`, `server/matchmaking` und `sync`.

**Warum das ein Fund war und kein Zufall.** Die Aussage stand an zwei Stellen im *aktiven* Changelog, nicht im Archiv, und war durch keine Suche nach `genome` mehr auffindbar, weil sie nicht das Wort „offen" enthielt. Ein Agent, der `docs/CHANGELOG.md` als Beleg für den Domänenstand benutzt hätte, hätte eine leere Domäne gelesen. Das ist derselbe Fehlertyp wie eine veraltete Doku, nur ohne Warnwort.

**Gates:** keine Quelldatei berührt, typecheck 0, Lint 0 über 305 Dateien, LOC-Caps ok, Hygiene ok, Shinon PASS.
