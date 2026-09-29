# docs/historisch/2026-09-29_roadmap-typecheck-owner.md

Aus `docs/ROADMAP.md` ausgelagert am 2026-09-29, weil das aktive Fenster an seine 200-Zeilen-Grenze stiess. Wortgleich übernommen.

## Statusupdate — 2026-09-29 (Der Typecheck läuft einmal, die Roadmap übergibt)

Der Typecheck lief lokal viermal und im Remote-Gate-Job dreimal über dieselben 245 Quelldateien: als eigener Schritt von `pnpm run -s gate`, erneut in `check`, erneut im Plugin `dead-code-gate` und erneut im `pre-push`-Hook, der die Plugin-Suite fährt. `tsconfig.json` trägt `noUnusedLocals` und `noUnusedParameters` seither selbst — bis dahin standen sie nur auf der Kommandozeile des Plugins, weshalb `pnpm run -s typecheck` und die Engine zwei verschiedene Programme fuhren. `dead-code-gate` ist danach die einzige Stelle, die den Compiler startet, `check` und `gate` rufen ihn nicht mehr zusätzlich, und der `gate`-Job im Workflow hat keinen eigenen Typecheck-Schritt mehr; der Windows-Job behält seinen, weil er `check` nicht fährt. `scripts/shinon/tests/typecheck-owner.test.mjs` hält den Vertrag fest. Beleg: 353 Tests in 52 Dateien, Lint 0, Hygiene ok, Shinon PASS, Worker-Dry-Run 138,70 KiB.

Die Roadmap selbst ist übergeben: Die Altfassung mit den Statusupdates vom 2026-09-25 bis 2026-09-28 liegt wortgleich in `docs/historisch/2026-09-29_roadmap-altfassung.md`.
