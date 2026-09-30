# packages/sim-core/docs/CHANGELOG.md — historischer Eintrag

Wortgleich aus dem aktiven Changelog übernommen, weil der Cap von 200 Zeilen
das Neuhinzufügen verlangt hat. Der Stand ist unverändert.

## 2026-09-29 — Zwanzig Basis-Monster, Traits und Boni, und die Mutation über den PRNG

**Scope:** neu `src/genome/` mit 22 Quellen und 2 Testdateien. Geändert `src/index.ts` (der Export der Domäne). **Nicht** geändert: die Kampfmechanik — `src/combat/rules.ts` bleibt unberührt, der Golden-Pin bleibt wortgleich grün.

Die Domäne `genome` ist damit gebaut und nicht mehr offen: sie besitzt Zucht, Stats und Gen-Seed. Der Pool führt **zwanzig** Basis-Monster (`roster-a.ts`, `roster-b.ts`), jedes mit drei Elementen zwischen 1,00 und 10,00, einer Palette, einem Trait und einem Bonus. Die Zahl ist die aus der Spieldesign-Aussage vom 2026-09-29; `docs/CONCEPT_REVIEW.md` nannte zuvor „25" und hatte die Liste selbst als ungeprüft markiert — beide Stellen sind jetzt auf den offenen Widerspruch nachgezogen, statt ihn stillschweigend zu glätten.
