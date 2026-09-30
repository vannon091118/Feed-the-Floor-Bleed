# packages/sim-core/docs/CHANGELOG.md — 2026-09-29

Aus dem aktiven Changelog nach `historisch/` verschoben, weil der
Hygiene-Cap von 200 Zeilen erreicht war. Wortgleich erhalten.

## 2026-09-29 — Placement Tile: der Kostenzuschlag fällt, die Suche wird gleichgewichtig

**Ein KI-Vorschlag hatte eine Falle gebaut, die nie im Scope war.** `CellType.Trap = 2` kostete vier Punkte statt einen, `findPath` suchte mit einem Umwegbudget von fünf Punkten und fiel bei dessen Überschreitung auf den Weg mit den wenigsten Tiles zurück (`trap-fallback`), und der Client zeigte daneben `Umweg` an. Mit der Entscheidung vom 2026-09-29 ist die Zelle eine Platzierungsmarkierung: Sie markiert den Bereich einer Gruppe, macht keinen Schaden und kostet nichts.

**Die Kosten waren der ganze Grund für die Maschinerie.** Ohne Zuschlag sind alle begehbaren Zellen gleich teuer, also ist die Suche eine Breitensuche: `grid/path.ts` hält sie jetzt selbst, mit fester Nachbarreihenfolge, FIFO-Warteschlange und `Int32Array`-Elternzeigern; `path-search.ts` und `min-heap.ts` sind gelöscht, ebenso `manhattan`, das nur Bezugsmaß des Budgets war. `PathMode` kennt nur noch `reachable` und `unreachable`, `PathResult.movementCost` ist `path.length - 1` — vorher zählten Spawn und Boss null, weshalb dieselbe Route 125 statt 126 Punkte meldete.

**Der Golden-Pin blieb wortgleich grün** (`94ba1954`, `f85b31c0`). Das ist der Beleg, den dieser Umbau braucht: Kein Fixture führt eine Platzierungszelle, also musste die neue Suche für diese Raster denselben Weg wählen — und tat es. Für die geänderte Regel steht ein eigener Test in `grid/path.test.ts`: Eine Platzierungszelle auf der geraden Route wird durchschritten und die Route bleibt bei 126 Bewegungspunkten; eine Wand an derselben Stelle macht sie unerreichbar. Ein zweiter Test pinnt, dass zwei Läufe über dasselbe Raster denselben Weg liefern.

**`sim_version 0.0.4`.** Der Pin bewegt sich nicht, weil kein Fixture die Zelle führt — die Regel tut es: Ein unter dem alten Kostenmodell gerechneter Log mit Platzierungszellen ist nicht reproduzierbar. Die drei Traptests in `path.test.ts` und die Fallback-Erwartung in `packages/contracts/test/contracts.test.ts` sind mit der Regel entfallen, `combat/actions.ts` nennt in seinem Kommentar jetzt die Breitensuche statt der gewichteten Suche.
