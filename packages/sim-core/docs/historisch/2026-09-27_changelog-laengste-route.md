# packages/sim-core/docs/historisch/2026-09-27_changelog-laengste-route.md

Aus `packages/sim-core/docs/CHANGELOG.md` ausgelagert am 2026-09-29, weil die aktive Datei an ihre 200-Zeilen-Grenze stiess. Wortgleich übernommen.

## 2026-09-27 — Die längste Route ist getestet, nicht nur kommentiert

**Scope:** neu `carveFullWidthRoute` und ein Fall in `src/grid/path.test.ts`. Produktivcode, Contracts, Hashes und Simulationsverhalten unberührt.

Die Annahme an `ROUTE_SLOTS` stand bisher nur als Kommentar: Eine Route betritt keine Zelle zweimal und hat damit höchstens so viele Schritte wie das Raster Zellen. `carveFullWidthRoute` baut den Korridor, der das prüft — alle geraden Zeilen offen, verbunden an abwechselnden Enden —, und weil jede weitere offene Zelle eine Abkürzung wäre, ist der vollständige Durchlauf die längste Route, die sich in einem 64×64-Raster erzwingen lässt: 32 Durchquerungen der vollen Breite, zusammen 2080 Zellen und 2079 Schritte. Der Test läuft sie ab und hält ihre Länge gegen `grid.cells.length`, womit auch der größte `routeIndex` von 2079 unter dem Trenner 4096 bleibt. Der Boss muss dafür ans linke untere Ende, weil der Zickzack nach 32 Verbindern dort ankommt; das Raster entsteht deshalb mit explizitem Spawn und Boss statt mit den Vorgaben (0|0) und (63|63).

Der Eintrag vom 2026-09-27 zum Review der Kernannahmen steht wortgleich in `packages/sim-core/docs/historisch/2026-09-27_changelog-kernannahmen-review.md`; er ist unverändert erhalten.
