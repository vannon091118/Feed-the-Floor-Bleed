# docs/CHANGELOG.md — Global

## 2026-09-30 — Ein Red Team hat den Hash-Fix angegriffen, und drei davon haben ihn gefunden

**Scope:** geändert `packages/sim-core/src/hash/fnv1a.ts`, `packages/sim-core/src/combat/state.ts`, `packages/sim-core/src/hash/hash-kappung.test.ts`, geändert `packages/sim-core/docs/CHANGELOG.md`, `docs/CHANGELOG.md` und `docs/PLAN_T2_3.md`. Neu war `packages/sim-core/src/combat/state-lives.test.ts` — **die Datei wurde in diesem Block wieder entfernt**, weil ihre Aussage sich als unbelegt erwies (die Messung deckt den Fehlerfall nicht ab, siehe oben), archiviert `docs/historisch/2026-09-30_changelog-ursprungs-cut.md`. `sim_version` und `CONTRACT_VERSION` bleiben unverändert — es ändert sich kein Feld, sondern ein Fehlverhalten. **Kein Pin wandert**, weil kein Lauf anders entschieden wurde.

**Der Hash-Fix brachte eine Endlosschleife mit.** `hashWord` prüfte das Wort mit `do … while (remaining > 0)`. Bei `Infinity` terminiert das nie, denn `Math.floor(Infinity / 256)` bleibt `Infinity`. Gemessen: `timeout` mit Exit 124, 200 000 Iterationen ohne Ende. Ich habe Verfügbarkeit gegen Determinismus getauscht. Die Vorversion war eine `for`-Schleife mit vier Runden und damit garantiert terminiert.

**Dieselbe Stelle schluckte Zahlen still.** `Math.trunc` schnitt nach unten: `1.9`, `1.1` und `1` lieferten denselben Beitrag, und `NaN`, `undefined` und `null` hashten wie eine echte `0`. Ein Wert, der keine Zahl ist, wirft jetzt, statt sich als etwas anderes auszugeben. Sieben Tests in `hash-kappung.test.ts` halten das fest.

**Die Zahl zur Kreuzprodukt-Bruchstelle war um 9 Größenordnungen falsch.** Genannt war `maxHp ≈ 3 001 199` mit der daraus abgeleiteten Level-Angabe 25. Das ist `√(2⁵³ / 1000)`. Nachgemessen: `3001199²` ist eine **sichere** Zahl, und Millionen von Paaren in dieser Größenordnung zeigen keine Divergenz. Die Grenze liegt beim Produkt `hp · maxHp` und braucht `maxHp` nahe **2⁵²**, weil 2⁵³+1 sonst auf denselben Float fällt wie 2⁵³. Der Konstruktionsfall braucht `maxHp` 2⁵² — der Test dazu wurde geplant und in diesem Block wieder entfernt, weil er die falsche Richtung geprüft hätte.

**Eine Zuschreibung im vorigen Eintrag war falsch.** Er schrieb, der Server akzeptiere einen gefälschten Log. `verifyCombatLog` und `replayCombat` werden nirgends vom Server gerufen; die einzige Prüfung sitzt in `fixture-job.ts` und läuft im Client-Pfad. Die Kollision war belegt, der Server war es nicht.

**Belegt durch** 551 Tests in 83 Dateien, typecheck 0, lint 0, LOC-Caps ok, Hygiene ok und Shinon PASS.
