# packages/sim-core/docs/historisch/2026-09-26_changelog-review-nachgang-t1-1.md

Der Block „Review-Nachgang T1.1" vom 2026-09-26 aus `packages/sim-core/docs/CHANGELOG.md`, ausgelagert am 2026-09-29 zusammen mit dem Hinweis auf die bereits wandernden Einträge vom 2026-09-25, weil die Datei an ihre Zeilengrenze stiess. Unveraendert erhalten; die aktive Fassung steht unter `packages/sim-core/docs/CHANGELOG.md`.

## 2026-09-26 — Review-Nachgang T1.1: toter Trail-Vergleich, Lint und Wrapper

- `src/combat/replay.ts`: `verifyCombatLog` enthielt nach T1.1 einen Längen- und Zellvergleich des Trails. Der war wirkungslos, weil `replayCombat` `log.trail` unverändert an `simulateCombat` durchreicht und der Vergleich damit jedes Element mit sich selbst verglich — der Block konnte nie `false` liefern. Er ist entfernt; der Trail bleibt über `fingerprintCombatLog` im Hash abgesichert.
- `src/combat/fingerprint.ts`: der Ein-Aufruf-Wrapper `trailHash` ist entfernt, der Ausdruck steht direkt in der Schleife. `let hash` wich `const`, der zuvor rote Biome-Lauf ist damit grün.
- Die frühere Zeile „`verifyCombatLog` prüft Länge und jede Zelle“ war falsch und ist durch diesen Eintrag überholt.

**Die Eintraege vom 2026-09-25 sind nach `packages/sim-core/docs/historisch/` gewandert** (`2026-09-25_changelog-dungeon-kern.md` und `2026-09-25_changelog-trail-hash.md`), weil diese Datei an ihre Zeilengrenze stiess. Sie sind unveraendert erhalten.
