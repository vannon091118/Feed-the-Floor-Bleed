# packages/client/docs/historisch/2026-09-27_client-tote-code-reste.md — Drei Reste des Tote-Code-Schritts abgeräumt

Wortgleich aus `packages/client/docs/CHANGELOG.md` verschoben am 2026-09-28, weil der aktive Changelog den 200-Zeilen-Cap erreicht hatte. Append-only.

## 2026-09-27 — Drei Reste des Tote-Code-Schritts abgeräumt

**Scope:** geändert `ui/roster-list.tsx`, `village/settlement.ts`, `village/index.ts`, `test/village-settlement.test.ts`, `docs/ARCHITEKTUR.md`, `FUNKTIONSGRAPH.md`, `REPOINDEX.md` und `STRINGMATRIX.md`. Kein Panel, kein Fenster, keine Dorf-Szene berührt.

**Der tote Statuskanal.** `roster-list.tsx` berechnete `tone` und schrieb `data-tone` auf einen Span; im ganzen Repo existiert keine `[data-tone]`-Regel, auch nicht in HEAD, wo sie nur an `.district` und `.meter__fill` hing, beides seit dem vorigen Schritt entfernt. Der Kommentar „Verletzung färbt die Zeile" beschrieb ein Verhalten, das es nie gab. Kanal und Behauptung sind raus, HP, Müdigkeit und Verletzung stehen als Zahl und Wort in der Zeile. **Offen für den Nutzer:** ob das Wort genügt oder die Zeile eine Farte bekommen soll — Designentscheidung, kein Aufräumen, deshalb hier nicht gebaut.

**Die Ableitung ohne Leser.** `settlement.ts` stand bei 146 von 150 erlaubten Code-Zeilen und leitete `districts` (Rathaus, Gilde, Verteidiger-Gehege mit `tone`, `share`, `note`) und `lastNight` ab. Seit das Panel weg ist, lasen nur noch Tests diese Felder. Entfallen sind `DistrictTone`, `VillageDistrict`, `NightRecord`, `HALL_STATE`, `hallTone`, `hall`, `guild`, `pen` und `nightRecord`, dazu die drei Barrel-Exporte; die Datei misst jetzt 27 statt 146 Code-Zeilen und hat damit 123 Zeilen Luft bis zur Cap. Wirtschaft und Expeditionen bleiben unberührt T2. `test/village-settlement.test.ts` schrumpft von 92 auf 21 Zeilen mit zwei Fällen: übrig bleiben Dorfname, Tag, Phase und die Roster-Identität (`roster === fixture.team`, die Invariante hinter dem Kommentar). Die Tagzählung nach Abschluss und Fehlschlag prüft `day-night-loop.test.ts` bereits (`fixture.day + 1` und `+ 2`) — keine Lücke, nur keine Doppelung mehr.

**Die Benennung.** „Dorflage" war Vokabular, das vorher keines war; der Domänenbegriff bleibt „Dorfblick". Zurückbenannt in ARCHITEKTUR (zwei Stellen), FUNKTIONSGRAPH, REPOINDEX (zwei Stellen), `settlement.ts` und in den beiden noch uncommitteten Changelog-Einträgen, die das Wort schon führten. Die `district/*`-Zeilen sind aus der Stringmatrix raus, weil es die Felder nicht mehr gibt.

**Gates:** typecheck 0, Lint 0, Tests grün, LOC-Caps ok, Hygiene ok, Shinon PASS einschließlich Redundanz-Gate.
