]633;E;echo "# packages/client/docs/CHANGELOG.md — historischer Eintrag";7bba11a0-b3d0-4563-9bf9-f00cb4ac1783]633;C# packages/client/docs/CHANGELOG.md — historischer Eintrag

Wortgleich aus dem aktiven Changelog übernommen, weil der Cap von 200 Zeilen
das Neuhinzufügen verlangt hat. Der Stand ist unverändert; der Block stand
zuletzt in `packages/client/docs/CHANGELOG.md`.

## 2026-09-28 — Die Timeline zählt nicht mehr selbst

**Scope:** geändert `src/raid/phases.tsx` (Ergebnis-Phase liest `summarizeCombat`), `src/raid/timeline-model.ts` (`resultCard` und `ResultCardData` entfernt), `src/village/state.ts` (Doc-Kommentar) und `test/raid-timeline.test.ts`. Kein Contract, kein Log, kein Hash.

**Der Befund stand im eigenen Code.** `timeline-model.ts` zählte Überlebende aus Todesereignissen selbst, mit einem eigenen Zweig für den Boss, während `packages/sim-core/src/combat/summary.ts` dieselbe Zahl über die Seite `monsters` bildete und den Boss mitzählte. Ergebnis-Panel (`summary.monstersAlive`) und Timeline (`card.monsters`) nannten damit für denselben Lauf verschiedene Monsterzahlen; `village/state.ts` führte den Widerspruch als Grund, warum die Beute nicht berechnet wird.

**Die Korrektur.** `resultCard` und `ResultCardData` sind weg. `ResultPhase` liest `summarizeCombat(current.log)` — dieselbe Funktion, die die Summary des Auftrags und damit die Dorf-Bilanz erzeugt. `monstersAlive` zählt dort ohne den Boss, `bossAlive` ist sein eigenes Feld, und Panel, Timeline und Dorfblick nennen dieselbe Zahl. Der Client behält keine eigene Zählregel; dass die Timeline den Log und nicht den Auftrag hält, ist der Grund, warum sie die Kurzfassung aus dem Log ableitet statt sie zu kopieren.

**Gates:** typecheck 0, 318 Tests, Lint 0.
