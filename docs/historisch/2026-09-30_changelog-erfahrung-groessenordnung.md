# docs/CHANGELOG.md — Global

## 2026-09-30 — Die Erfahrung bekommt eine gemessene Größenordnung statt eines Platzhalters

**Scope:** geändert `docs/PLAN_T2_3.md` (Abschnitt 5 neu, Abschnitt 2 aktualisiert, Abschnitte 5–7 neu nummeriert). Kein Code, kein Contract, kein Hash, keine Zahl im Spiel.

**Der Block hatte eine Lücke, die als `[K]` durchging.** Slice B braucht die Zahl, wie viel Erfahrung ein Schaden wert. Sie stand als `[K]` **ohne jede Größenordnung** — das ist kein offener Wert, das ist ein Platzhalter, und ein Platzhalter wird geraten, sobald jemand baut.

**Gemessen, nicht geraten.** Über 20 Seeds mit drei echten Basisarten auf dem Standardraster: 8 895 604 Schaden über 7 Einheiten, **Ø 1 270 801** je Einheit, Spanne 195 436 bis 2 977 794. Der auffälligste Wert ist nicht der Mittelwert, sondern der letzte: **keine Einheit blieb ohne Schaden.** Das stützt die Entscheidung, jede Einheit in die Bilanz aufzunehmen — die Null-Fälle gibt es, aber sie sind nicht der Normalfall.

**Der Vorschlag 2 500 hat eine Begründung, keine Bauchentscheidung.** Die Kurve soll kallierend exponentiell beginnen. Bei Divisor 1 000 stünde ein Wesen nach dem ersten Kampf bei über 1 200 Erfahrung und damit weit vor der ersten Kurvenstufe — die exponentielle Form hätte nichts mehr zu leisten, weil der Startpunkt sie überholt. Bei 2 500 bleiben die ersten Stufen flach, und der Median von 1 156 010 liegt deutlich über dem Minimum, die Spanne ist also sichtbar.

**Ein zweiter Vorschlag bleibt offen:** dieselbe Skalierung für Helden. Die Festlegung gilt für beide Seiten, aber gemessen wurde an der Monstersumme; der Held verursacht darin den kleineren Teil. Vorschlag ist derselbe Divisor, damit die Kurve auf beiden Seiten dieselbe Form hat. Auch das ist `[K]`.

**Die Zahl bleibt `[K]`** und gehört an ihre Quelle in `sim-core/src/genome/balance.ts` **mit dem Messprotokoll im Kommentar** — sonst weiß in einem Jahr niemand mehr, woher sie kam. Die Messdatei selbst wurde nach dem Lauf gelöscht: Ein Wegwerf-Helfer, der bleibt, ist genau die Art Zettel, die hier nichts verloren hat.
