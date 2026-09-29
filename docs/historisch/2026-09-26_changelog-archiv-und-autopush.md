# docs/historisch/2026-09-26_changelog-archiv-und-autopush.md

Wortgleich aus `docs/CHANGELOG.md` verschoben am 2026-09-29, um Platz für den Eintrag zum entdoppelten Typecheck zu schaffen. Der aktive Changelog stand bei 199 von 200 Zeilen.

## 2026-09-26 — Ältere Changelog-Einträge ins Append-only-Archiv verschoben

`docs/CHANGELOG.md` stand bei 174 Zeilen gegen einen Cap von 200 und wäre beim nächsten ausführlichen Eintrag gesprengt; der Hygiene-Gate zählt `split('\n')`, gemessen waren es 175. Der Schnitt liegt an der Tagesgrenze: Die sieben Einträge vom 2026-09-25 zur sichtbaren Basis, zur Entwicklungsumgebung und zur Governance-Härtung sind nach `docs/historisch/2026-09-25_changelog-sichtbare-basis-und-tooling.md` gewandert. Der aktive Changelog führte damit nur noch den 2026-09-26 und stand zwischen dem Verschieben und diesem Eintrag bei 123 Zeilen mit sechzehn Überschriften; mit diesem Eintrag sind es 131 Zeilen und siebzehn.

Die Texte sind wortgleich verschoben, nicht gekürzt und nicht neu geschrieben. Geprüft wurde das über die Überschriftenmenge: vor dem Verschieben 23 aktive Einträge, nachher dieselben 23 in aktiv plus vier Archiven, jeder genau einmal. Der Sinn der Verschiebung ist nicht die Zeilenzahl, sondern die Append-only-Regel: Das Archiv wächst, der aktive Changelog bleibt das Fenster auf den laufenden Stand.

`docs/REPOINDEX.md` registriert die neue Datei und holt dabei die bisher fehlende Erwähnung von `2026-09-25_changelog-backend-und-initialstand.md` nach.

## 2026-09-26 — Auto-Push und Commit-Pflicht als by design festhalten

`docs/REGELWERK_GIT.md` bekommt den Abschnitt „Auto-Push und Commit-Pflicht". Bisher stand der Auto-Push nur als Nebensatz im Hook-Abschnitt und als `SHINON_AUTO_PUSH=0` für Lifecycle-Tests, also als Ausnahme von etwas, dessen Begründung nirgends geschrieben war; der Default in `.husky/post-commit` ist `SHINON_AUTO_PUSH=1`, damit schiebt ein gewöhnlicher Commit seinen Branch ohne Zutun, und eine nicht begründete Voreinstellung ist keine Governance. Die Begründung trägt der `pre-push`-Hook, der unmittelbar vor dem Push `scripts/shinon/engine.mjs --full` fährt: Der Auto-Push ist Fortsetzung der Kette von `pre-commit` bis `pre-push` und kein Bypass neben ihr, während die Commit-Pflicht dieselbe Kette in die andere Richtung beschreibt, weil Slice-Engine, Commit-Text-Regel, mechanischer Bump mit `version-gate` und Amend das Entstehen eines nicht gate-konformen Commits verhindern. Sicher macht das erst das Push-Ziel: Der Auto-Push schiebt den aktuell ausgecheckoutten Branch und erreicht `main` nicht, weil `main` `Shinon Gate` mit `strict`, `required_linear_history` und `enforce_admins` verlangt. Ergänzt sind die zwei Grenzen, ein grüner lokaler Lauf ersetzt den verpflichtenden Remote-Status nicht und `SHINON_SKIP_BUMP=1` ist Rekursionsschutz, keine Aussage über das Push-Verhalten.

`docs/ROADMAP.md` ersetzt seinen offenen Prüfpunkt zum T2-1-Branch durch die Messung: `origin/feat/dorfwirtschaft-t2-1` enthält testgedeckte Arbeit, liegt aber fünf Commits und zwei Toolchain-Migrationen hinter `main` und ist deshalb allein rot, was ihn als Rebase- und nicht als Merge-Kandidaten ausweist.
