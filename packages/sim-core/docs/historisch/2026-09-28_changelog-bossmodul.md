# packages/sim-core/docs/CHANGELOG.md — 2026-09-28

Aus dem aktiven Changelog nach `historisch/` verschoben, weil der
Hygiene-Cap von 200 Zeilen erreicht war. Wortgleich erhalten.

## 2026-09-28 — Der Boss bekommt ein Modul, und `monstersAlive` zählt ohne ihn

**Scope:** neu `src/combat/boss.ts`; geändert `src/combat/rules.ts` (Boss-Werte und `bossSpec` ausgezogen), `src/combat/state.ts` (`isBoss` statt Zeichenkettenvergleich), `src/combat/summary.ts` (`monstersAlive` ohne Boss, `bossAlive` über `isBossAlive`), `src/combat/index.ts` (Barrel) und `src/combat/combat.test.ts` (ein neuer Fall). Contracts, Werte und Log-Hash unberührt.

**Der Befund.** `monstersAlive` wurde an zwei Stellen berechnet und uneinig: `summary.ts` zählte über `aliveOnSide(..., 'monsters')` und damit den Boss mit — er trägt `side: 'monsters'` —, während `packages/client/src/raid/timeline-model.ts` ihn in einem eigenen Zweig abzog. Für denselben Log nannten Core und Client verschiedene Zahlen, und beide standen im Bild.

**Die Korrektur.** `boss.ts` ist der neue Owner: `BOSS_ROLE`, `isBoss`, `isBossAlive`, `BOSS_RULES` und `bossSpec`. `rules.ts` importiert `bossSpec` statt ihn zu führen, `state.ts` sucht den Boss mit `states.find(isBoss)`, und `summary.ts` zählt Monster über eine Rolle, die den Boss ausnimmt, während `bossAlive` aus derselben Rollenerkennung kommt. Damit können die beiden Felder nicht mehr auseinanderlaufen. Boss-exklusive Verstärkungen haben jetzt einen Platz, statt als dritter Monsterwert in `PROVISIONAL_RULES` zu liegen.

**Was sich nicht ändert.** Werte, IDs, Reihenfolge und Spec-Form sind unverändert; der Kampf-Hash bleibt gleich. `combat.test.ts` pinnt den neuen Fall mit abgeschaltetem Tick-Limit: zwei Monster, ein Boss, `monstersAlive === 2`, `bossAlive === true`.

Die Einträge vom 2026-09-27 zur längsten Route und zum Review der Kernannahmen stehen wortgleich in `packages/sim-core/docs/historisch/2026-09-27_changelog-laengste-route.md` und `2026-09-27_changelog-kernannahmen-review.md`; sie sind unverändert erhalten.
