# packages/sim-core/docs/CHANGELOG.md — historischer Eintrag

Wortgleich aus dem aktiven Changelog übernommen, weil der Cap von 200 Zeilen
das Neuhinzufügen verlangt hat. Der Stand ist unverändert.

## 2026-09-29 — Zwanzig Basis-Monster, Traits und Boni, und die Mutation über den PRNG

**Scope:** neu `src/genome/` mit 22 Quellen und 2 Testdateien. Geändert `src/index.ts` (der Export der Domäne). **Nicht** geändert: die Kampfmechanik — `src/combat/rules.ts` bleibt unberührt, der Golden-Pin bleibt wortgleich grün.

Die Domäne `genome` ist damit gebaut und nicht mehr offen: sie besitzt Zucht, Stats und Gen-Seed. Der Pool führt **zwanzig** Basis-Monster (`roster-a.ts`, `roster-b.ts`), jedes mit drei Elementen zwischen 1,00 und 10,00, einer Palette, einem Trait und einem Bonus. Die Zahl ist die aus der Spieldesign-Aussage vom 2026-09-29; `docs/CONCEPT_REVIEW.md` nannte zuvor „25" und hatte die Liste selbst als ungeprüft markiert — beide Stellen sind jetzt auf den offenen Widerspruch nachgezogen, statt ihn stillschweigend zu glätten.

**Alle Zahlen sind `[K]`.** Die Elementwerte, Kopplungsstärke, Mutationsdrift, Effektprozente und die Gewichte in `stats.ts` sind nicht abgenommen; die Kampfbalance ist laut `docs/VISUAL_GRUNDSATZ.md` offen. Die Mechanik steht, die Werte nicht — jede Konstantengruppe trägt den Vermerk an der Quelle, an der sie gepflegt wird.

**Der Grund für die Kopplung.** Drei Elemente allein wären drei unabhängige Würfe und damit Zufallsnebel statt Spektrum. In `mutation.ts` zieht jedes Element sein Gegenstück runter — Masse gegen Tempo, Tempo gegen Härte, Härte gegen Masse. Ein Kind kann deshalb nicht „alles stark" sein, und die Kopplung begrenzt sich selbst, weil jede Achse den Wert benutzt, den die vorherige Korrektur hinterlassen hat. `breeding.test.ts` pinnt das als feste Zusage: Über 200 Kinder aus zwei Eltern erreicht **keines** das Elternmaximum auf allen drei Achsen gleichzeitig.

**Die Zuchtkette hat eine feste Reihenfolge und nur eine Zufallsquelle.** `breed` vererbt die Elemente Elternteil für Elternteil, wendet die Kopplung an, mutiert zuletzt und steigert die Generation. Der Seed kommt von außen in den internen PRNG (`deriveSeed` über `createRng`); die Basis-ID geht als Hash hinein, damit dieselbe Basisart gleich mutiert und zwei verschiedene nicht. **`mutate` ersetzt höchstens eine Eigenschaft, und zwar eine, die das Wesen noch nicht führt.** Die erste Fassung zog den Ersatz aus dem gesamten Pool; traf der Zufall den einen bereits vorhandenen Wert, verschwand die Eigenschaft dauerhaft, weil die Deduplizierung danach die Länge kürzte. Gemessen über 500 Seeds verlor ein Genom mit zwei Traits in 19 Fällen einen davon. Der Ersatz nimmt jetzt einen Kandidaten aus der Liste der noch nicht geführten Werte; trägt das Genom alle, wird nichts getauscht. Aus einem Austausch ist damit eine Änderung geworden und keine Reduktion.

**Reihenfolge der Ableitung:** Kopplung aus den Elementen (`stats.ts`), dann Traits, dann Boni (`resolve.ts`). Dass die Boni zuletzt kommen, ist die Regel und kein Zufall: ein `bulwark` auf einem `toughHide`-Monster trägt mehr als auf einem nackten, weil er verstärkt, was der Trait aufgebaut hat.

**Ein Effekt sieht das Genom, nicht nur die Zahlen.** Die Signatur ist `apply(stats, genome)`. `vitality` braucht das: der Bonus liest Element 0 und streckt seinen Zuschlag von 12 % bis 26 % über die Masse, sodass ein Glutkolos spürbar mehr bekommt als ein Schattenläufer. `endurance` bleibt der feste Faktor — genau darin unterscheiden sich die beiden. Vor dieser Änderung war beides ein flacher Multiplikator, während die Kommentare das andere behaupteten.

**Jeder Trait und jeder Bonus ist eine eigene Datei** — `trait-tough-hide.ts` bis `trait-focused.ts`, `bonus-bulwark.ts` bis `bonus-vitality.ts`. Jeder Effekt gibt und nimmt: `keenEdge` schärfer den Angriff und kostet Gesundheit, `bulwark` ist dagegen der reine, schmalse Bonus. Ohne den Gegenwert wäre ein Zucht-Trait eine freie Verbesserung und der Stack beliebig groß. Die Initiative-Grenze und die Cooldown-Grenze stehen an einer Stelle (`effect-kit.ts`), damit nicht drei Effekte drei Schreibweisen derselben Klammermauer aufschreiben.

**Auswertung:** Die Basis-Kampfwerte kommen aus `PROVISIONAL_RULES.monster` statt aus einer zweiten Kopie in `stats.ts`; `genome` liest damit dieselben Ausgangswerte, mit denen der Core rechnet. Der Redundancy-Gate hatte die Dublette zu Recht gemeldet. Der Import geht dabei an `../combat/rules` und nicht an den Barrel — der Barrel zieht den ganzen Kampfgraphen in die Abhängigkeiten, obwohl nur eine Konstante gebraucht wird.

