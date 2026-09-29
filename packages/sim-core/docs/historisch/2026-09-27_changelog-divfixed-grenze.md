# packages/sim-core/docs/historisch/2026-09-27_changelog-divfixed-grenze.md

Der Block „`divFixed` trägt seine Genauigkeitsgrenze" vom 2026-09-27 aus `packages/sim-core/docs/CHANGELOG.md`, ausgelagert am 2026-09-29, weil die Datei an ihre Zeilengrenze stiess. Unveraendert erhalten; die aktive Fassung steht unter `packages/sim-core/docs/CHANGELOG.md`.

## 2026-09-27 — `divFixed` trägt seine Genauigkeitsgrenze und hat einen Test

**Scope:** geändert `src/math/fixed.ts` und `src/math/math.test.ts`. Kein Produktionsaufrufer, kein Verhalten geändert.

`mulFixed` trug seine Mantissengrenze, `divFixed` nicht. Die Grenze liegt hier aber woanders: Genau ist die Division, solange der Zähler `left * FIXED_SCALE` genau darstellbar bleibt, also bis `|left| = 2^53 / FIXED_SCALE` (rund 9,0e12), und nicht erst beim Ergebnis. Darunter greifen drei Dinge zusammen: der Zähler ist exakt, der Quotient bleibt ganzzahlig darstellbar, und weil der wahre Wert mindestens `1 / right` von der Trunkierungsgrenze entfernt liegt, kann die korrekt gerundete Division ihn nicht über eine Ganzzahl hinwegschieben. Oberhalb rundet schon der Zähler um bis zu eine halbe ulp, und das Ergebnis wird falsch — nachgemessen um 1 bei `divFixed(9007199254740994, 1001)` und um 170 bei `divFixed(2 ** 53, 3)`. Deterministisch bleibt es, genau nicht.

`math.test.ts` pinnt beide Seiten der Grenze: die größte exakte Größe in beiden Vorzeichen, einen Fall in Combat-Größenordnung und einen Fall jenseits der Grenze, der die exakte Zahl nicht mehr trifft. `divFixed` hat weiterhin keinen Produktionsaufrufer; die Doku steht, bevor einer entsteht.
