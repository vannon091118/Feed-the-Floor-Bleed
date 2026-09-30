# packages/sim-core/docs/CHANGELOG.md — 2026-09-28

Aus dem aktiven Changelog nach `historisch/` verschoben, weil der
Hygiene-Cap von 200 Zeilen erreicht war. Wortgleich erhalten.

## 2026-09-28 — Die Summary trägt den Verteidiger-Roster

**Scope:** geändert `src/combat/summary.ts` (neues Feld `defendersTotal`). Kein Hash, keine Regel und kein Verhalten geändert — der Golden-Pin bleibt wortgleich grün und belegt das.

`summarizeCombat` füllt jetzt `defendersTotal` aus den Einheiten des Logs: alle Einheiten der Monster-Seite, den Boss eingeschlossen. Damit ist die Zahl der gefallenen Gegner aus einem abgelegten Ergebnis berechenbar, ohne den Kampflog zu laden — `monstersAlive` und `bossAlive` nennen nur die Überlebenden, und `ResultPayloadSchema` trägt den Log nicht. Die Zahl kommt aus derselben Einheitenliste wie die Überlebendenzahlen, es gibt also keine zweite Quelle. Der Anlass des Felds steht im Contract, gerechnet wird damit noch nichts. `combat.test.ts` prüft beide Zusagen gegen die Todesereignisse des Logs statt sie zu glauben: den Pin auf `defendersTotal` und die Identität `defendersTotal - monstersAlive - (bossAlive ? 1 : 0)` gleich der Zahl der gefallenen Verteidiger.
