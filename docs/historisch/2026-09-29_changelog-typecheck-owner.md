# docs/historisch/2026-09-29_changelog-typecheck-owner.md

Aus `docs/CHANGELOG.md` ausgelagert am 2026-09-29, weil die aktive Datei an ihre 200-Zeilen-Grenze stiess. Wortgleich übernommen.

## 2026-09-29 — Der Typecheck läuft einmal statt viermal, und die Roadmap übergibt an T1

**Die Messung, nicht der Verdacht.** Derselbe Compilerlauf über dieselben 245 Quelldateien lief lokal viermal: als eigener Schritt von `pnpm run -s gate`, ein zweites Mal in `check`, ein drittes Mal im Plugin `dead-code-gate` und ein viertes Mal im `pre-push`-Hook, der die Plugin-Suite erneut fährt. Im Remote-Gate-Job waren es entsprechend drei Läufe pro Lauf. Ein zweiter Durchgang derselben Prüfung ist keine zweite Sicherheit, sondern Wartezeit; zwei Aufrufstellen mit zwei Regelsätzen sind zusätzlich ein Fehler, der grün bleibt.

**Der Schnitt ist ein Owner statt vier Aufrufer.** `tsconfig.json` trägt `noUnusedLocals` und `noUnusedParameters` jetzt selbst — vorher standen sie nur auf der Kommandozeile von `scripts/shinon/plugins/dead-code-gate.mjs`, weshalb `pnpm run -s typecheck` und die Engine streng genommen zwei verschiedene Programme fuhren. `dead-code-gate` bleibt danach die einzige Stelle, die den Compiler startet: `check` erreicht ihn über die Engine, `gate` nur über `check`, und der `gate`-Job in `.github/workflows/shinon.yml` verliert seinen eigenen Typecheck-Schritt. Der Windows-Job behält seinen, weil er `check` nicht fährt und sonst gar keinen Typecheck hätte.

**Ein Wächter statt einer Konvention.** `scripts/shinon/tests/typecheck-owner.test.mjs` hält den Vertrag fest: `gate` und `gate:quick` erreichen den Compiler nur mittelbar, genau eine Plugin-Datei startet `tsc`, die Flags liegen im tsconfig statt auf einer Kommandozeile, `dead-code-gate` steht in `scripts/shinon/policy.json` unter `always` — ohne das fehlte der Typecheck an Commit und Push —, und der Remote-Job wiederholt ihn nicht.

**Die Roadmap übergibt.** Mit dem Abschluss von T1 greift die eigene Prioritätsregel: Das bisherige T2 ist jetzt T1, das bisherige T3 ist jetzt T2. Die Altfassung mit allen Statusupdates vom 2026-09-25 bis 2026-09-28 liegt wortgleich in `docs/historisch/2026-09-29_roadmap-altfassung.md`, `docs/ROADMAP.md` führt als aktives Fenster die offenen Blöcke, die Prioritätsregel und die offenen Punkte mit Besitzer. **Der direkte Followup ist T1 mit dem Block T2.2** — die Verdrahtung der Platzierungsgeometrie an die Dorfszene und der Rückkehr-Toast.

**Gates:** typecheck 0 (ein Lauf), 353 Tests in 52 Dateien, Lint 0, LOC-Caps ok (245 Quellen), Hygiene ok, Shinon PASS, Client-Build und Worker-Dry-Run ok.

Der Eintrag vom 2026-09-28 zum Verteidiger-Roster im Wire-Contract und zum Boss als eigenes Wesen steht wortgleich in `docs/historisch/2026-09-28_changelog-roster-und-boss.md`. Er ist unverändert erhalten, samt seines Verweises auf `docs/historisch/2026-09-28_changelog-dorfbalance.md`.
