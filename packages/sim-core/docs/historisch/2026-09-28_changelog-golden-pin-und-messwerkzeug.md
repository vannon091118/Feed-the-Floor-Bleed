# packages/sim-core/docs/CHANGELOG.md — 2026-09-28

Aus dem aktiven Changelog nach `historisch/` verschoben, weil der
Hygiene-Cap von 200 Zeilen erreicht war. Wortgleich erhalten.

## 2026-09-28 — Golden-Pin des Kampf-Hashes und ein Messwerkzeug für die Siegquoten

**Scope:** neu `src/combat/combat-pin.test.ts` und `src/combat/balance-report.test.ts`. Kein Produktivcode, keine Regel und kein Hash geändert.

**Die Lücke war der Pin, nicht die Abdeckung.** Die Engine-Tests verglichen bisher ausschließlich zwei Läufe miteinander (gleicher Seed, Seed-Sensitivität, Trail, Replay). Eine beiläufige Änderung an Einheiten, Regelwerten oder Event-Reihenfolge wäre damit grün geblieben, solange sie nur deterministisch ist — und hätte den Hash jedes gespeicherten Replays verschoben, ohne dass eine Version steigt. `combat-pin.test.ts` pinnt zwei Läufe absolut, beide Seed 4242, Teamgröße 3: offenes Fixture-Grid mit zwei belegten Plätzen (`94ba1954`, `monsters-win`, 225 Ticks, 417 Ereignisse, 127 Trail-Zellen) und die Umweg-Route mit voller Belegung (`f85b31c0`, `monsters-win`, 401 Ticks, 1010 Ereignisse, 253 Trail-Zellen). Der rote Erstlauf vor dem Eintragen der Werte belegt, dass der Pin greift. Ein roter Lauf ist dann eine Entscheidung — gewollt? Version anheben? Doku nachziehen? —, und die Zahlen werden im selben Commit angepasst.

**Ein Messwerkzeug, kein Sollwert.** `balance-report.test.ts` fährt die Stufenverteilung über Seeds und Verteidigerplätze und druckt sie als Tabelle. Es pinnt bewusst kein gewünschtes Ergebnis: ein Test, der den Ist-Stand als Ziel festschreibt, wäre die Fehlerquelle mit grüner Anzeige. Standardbreite 32 Seeds je Zeile, `BALANCE_SEEDS=500` für eine belastbare Messung. Geprüft wird nur, was gelten muss: jede Stufe ist bekannt, und die Rohzahlen summieren sich je Zeile auf die Seed-Zahl — nicht die gerundeten Prozente, die sich auf 99 bis 101 summieren.

**Befund, 500 Seeds je Belegung bei Teamgröße 3 auf dem offenen Fixture-Grid:** Siegquote 90 % bei null belegten Plätzen, 65 % bei einem, 81 % bei zwei und 0 % ab drei; ein Zeitlimit tritt nicht auf, die mittlere Kampfdauer liegt bei 217 bis 228 Ticks. Die Roadmap-Behauptung „0 % ab drei belegten Verteidigerplätzen" ist damit im Repo reproduziert. Zwei Auffälligkeiten, die keine Regeländerung sind: Die Kurve ist zwischen einem und zwei Plätzen nicht monoton, weil der zweite Platz an Routenposition 900 fast am Boss sitzt und die Zielwahl sich mit der Einheitenliste ändert; und die 2-Platz-Zeile lag bei 200 Seeds bei 84 % und bei 500 Seeds bei 81 %, die Standardbreite ist für Aussagen also zu klein.
