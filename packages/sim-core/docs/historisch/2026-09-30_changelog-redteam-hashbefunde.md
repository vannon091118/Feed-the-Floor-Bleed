# packages/sim-core/docs/CHANGELOG.md

## 2026-09-30 — Ein Red Team hat den Hash-Fix angegriffen, und drei Befunde haben ihn gefunden

**Scope:** geändert `src/hash/fnv1a.ts`, `src/combat/state.ts`, `src/hash/hash-kappung.test.ts` und `src/combat/combat-pin.test.ts` (nur der Kommentar zur sechsten Verschiebung). Neu war `src/combat/state-lives.test.ts` — **die Datei wurde in diesem Block wieder entfernt**, weil ihre Aussage sich als unbelegt erwies. Angepasst `docs/CHANGELOG.md` hier und im globalen Changelog sowie `docs/PLAN_T2_3.md`. **`sim_version` und `CONTRACT_VERSION` bleiben unverändert**, und **kein Pin wandert** — es ändert sich kein Feld und kein Lauf entscheidet sich anders.

**Der Hash-Fix brachte eine Endlosschleife mit.** `hashWord` prüfte mit `do … while (remaining > 0)`. Bei `Infinity` terminiert das nie, denn `Math.floor(Infinity / 256)` bleibt `Infinity`. Gemessen mit `timeout`: Exit 124 nach 200 000 Iterationen ohne Ende. Die Vorversion war eine `for`-Schleife über vier Runden und damit garantiert terminiert. Das war kein Fund, das war eine Verschlechterung, die ich selbst eingebaut hatte.

**Dieselbe Stelle schluckte Zahlen still.** `Math.trunc` schnitt nach unten: `1.9`, `1.1` und `1` lieferten denselben Beitrag. `Math.trunc(NaN)`, `Math.trunc(undefined)` und `Math.trunc(null)` sind alle `0`, also hashten ein vergiftetes Feld und eine echte Null gleich. Jetzt wirft beides, und die `0` behält ihren eigenen Beitrag.

**Die Zahl zur Kreuzprodukt-Bruchstelle war um 9 Größenordnungen falsch.** Genannt war `maxHp ≈ 3 001 199`, daraus abgeleitet Level 25. Das ist `√(2⁵³ / 1000)`. Nachgemessen: `3001199² = 9 007 195 437 601` ist eine **sichere** Zahl, und eine Suche über Millionen von Paare in der Größenordnung 3 001 199 bis 3 001 199 999 fand **keine** Divergenz. Die Grenze liegt beim Produkt `hp · maxHp` und braucht `maxHp` nahe **2⁵²**, weil 2⁵³+1 sonst auf denselben Float fällt wie 2⁵³. Da 2⁵³+1 durch 3 teilbar ist, existiert genau ein konstruierter Fall: `maxHp` 2⁵² mit `hp` 3 gegen `maxHp` 3002399751580331 mit `hp` 2. Ein zugehöriger Test wurde geplant und in diesem Block wieder entfernt:
Er prüfte die falsche Richtung und wäre am Kreuzprodukt grün geblieben.

**Der Test ist der Grund, warum diese Datei überhaupt existiert.** `behavior.test.ts` setzt `maxHp: 100`, vier Größenordnungen unter jeder Schwelle; ein Rückbau wäre dort grün geblieben. Ein Test, der nichts fängt, ist eine Behauptung mit grünem Haken.

**Eine Zuschreibung im vorigen Eintrag war falsch.** Er schrieb, `verifyCombatLog` habe den zweiten Kampf akzeptiert. Gemessen: `verifyCombatLog` und `replayCombat` werden **nirgends vom Server gerufen** — `grep` findet nur Definition und Testaufrufe. Die einzige Prüfung im Bestand sitzt in `src/combat/fixture-job.ts` über `replayCombat` und läuft im Client-Pfad. Die Kollision war belegt, die Zuschreibung an einen Server war es nicht.

**Belegt durch** 551 Tests in 83 Dateien, typecheck 0, lint 0, LOC-Caps ok, Hygiene ok und Shinon PASS.
