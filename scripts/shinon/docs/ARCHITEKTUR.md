# scripts/shinon/docs/ARCHITEKTUR.md

## Rolle

Lokale Gate-Engine + Test-Suite. Globale Governance-Module laufen bei jedem Commit; deterministische Domain-Checks werden zusätzlich nach Commit-Slices ausgewählt. Full-Run ist NICHT der Standard — sicher + performant mit Base + Core.

## Slicer

- `git diff --cached --name-only` → changed Files
- `shouldRun(plugin, changed)` → skip/run
- Base (immer): `loc-gate`, `global-loc-gate`, `hygiene-gate`, `version-gate`, `commit-gate`, `commit-integrity`, `schema-contract`, `modularity-gate`, `dead-code-gate`, `redundancy-gate`
- Core (nur bei relevantem Slice): `core-determinism` (sim-core/contracts, bannt Math.random + crypto.random + Date/sin/pow), `false-positive` (combat/genome/matchmaking/sync)
- `lib/engine-policy.mjs` entscheidet diese Trigger rein aus der geladenen Policy: `shouldRun` für Slice und Full, `shouldRunLocal` für die kurze Menge; `engine.mjs` orchestriert nur noch Dateisammlung, Plugin-Start und Verdict.
- Drei Betriebsarten: Slice (Standard, staged Diff), `--full` (alle Plugins, Job `Shinon Gate` und `pnpm run -s gate:full`) und `--local` (die sieben Plugins aus `engine.local`, beide Hooks und `pnpm run -s gate`).

## Plugins

Je Plugin eine `.mjs` in `plugins/`, max 150 LOC, ein Job. Gemeinsame Source-Erkennung, Ignore-Regeln und LOC-Zählung liegen in `lib/source-scan.mjs`; versionierte Gate-, LOC-, Ignore-, Dependency- und Engine-Trigger-Policies liegen in `policy.json`, werden über `policy.mjs` geladen und vor jeder Verwendung strikt mit `policy-schema.mjs` validiert. Zusätzlich müssen alle konfigurierten Engine-Plugin-Namen zu tatsächlich vorhandenen Plugin-Dateien passen und jede vorhandene Plugin-Datei muss einen Always- oder Slice-Trigger besitzen. `engine.mjs` entscheidet Slices ausschließlich anhand dieser Policy. Nur die unterstützte Policy-Version ist zulässig; bei inkompatibler oder fehlerhafter Policy gibt es keinen stillen Fallback, sondern einen Hard-Fail. Globale Module `global-loc-gate`, `schema-contract`, `modularity-gate`, `dead-code-gate` und `redundancy-gate` sind Hard-Fails und laufen unabhängig vom Diff. Lokal fahren `pre-commit`, `pre-push` und `pnpm run -s gate` seit dem 2026-09-29 nur `engine.local` (`loc-gate`, `global-loc-gate`, `hygiene-gate`, `modularity-gate`, `version-gate`, `commit-gate`, `commit-integrity`); `dead-code-gate`, `redundancy-gate`, `schema-contract` und die beiden Slices laufen fail-closed im Job `Shinon Gate`.

## Der Typecheck hat einen Owner

`plugins/dead-code-gate.mjs` startet seit dem 2026-09-29 als einzige Stelle den Compiler; `noUnusedLocals` und `noUnusedParameters` stehen dafür in `tsconfig.json` und nicht mehr auf seiner Kommandozeile. Vorher lief derselbe Programmlauf viermal — als eigener Schritt von `pnpm run -s gate`, erneut in `check`, erneut im Plugin und erneut im `pre-push`-Hook — und zwei Aufrufstellen fuhren zwei verschiedene Regelsätze, ohne dass es auffiel. `pnpm run -s typecheck` bleibt der Einzelbefehl mit demselben Programm; im Job `gate` läuft genau ein Lauf. Seit dem 2026-09-29 liegt er ausschließlich remote und in `gate:full`, weil `dead-code-gate` nicht mehr zu `engine.local` gehört und der Pre-Push-Hook deshalb nicht mehr den Compiler erreicht. `tests/typecheck-owner.test.mjs` prüft, dass das so bleibt: keine zweite Aufrufstelle in `gate` oder `gate:quick`, genau eine Plugin-Datei mit `tsc`, die Regeln im tsconfig, `dead-code-gate` unter `always` und nicht unter `local`, kein eigener Typecheck-Schritt im Job `gate` und in beiden Hooks `engine.mjs --local`.

## Hooks & Kette

pre-commit → `engine.mjs` (slice: Base immer, Core nach Bedarf) → prepare-commit-msg → `prepare-commit-msg.mjs` (füllt Merge-/Squash-Bodies aus `lib/integration-text.mjs` auf) → commit-msg → `commit-msg.mjs` (Prosa 200, Bullets, Footer, Datei-Nennung) → post-commit → Root-Commit-Erkennung bleibt `0.0.1`, danach `bump-version.mjs` (Next-Bump-Zähler mit Basis aus `origin/main`, 0.0.1→0.0.99→0.1.0, verweigert doppelte Nummern) mit formatstabiler Ersetzung der bestehenden JSON-Felder + `amend` mit aktiven Hooks + `version-gate` + Auto-Push → pre-push → erst die Sperre auf den Default-Branch, dann `engine.mjs --local` (Minimal-Gate; die vollständige Suite liegt remote). GitHub Actions fährt den vollständigen Lauf als `Shinon Gate` bei jedem Push auf `main` und bei jedem Pull Request gegen `main`; die Range kommt beim Push aus `github.event.before`, beim Pull Request aus `github.event.pull_request.base.sha`. Ist der PR-Gate grün, schiebt der Job `promote` (`needs: gate`) den geprüften PR-Kopf per Fast-Forward nach `main`; ein Nicht-Fast-Forward oder eine fehlende Signatur lässt ihn sichtbar scheitern. Geschoben wird mit dem Repository-Secret `PROMOTE_TOKEN`, nicht mit dem mitgelieferten `GITHUB_TOKEN`: GitHub startet für Events aus einem `GITHUB_TOKEN`-Push keinen neuen Lauf, der push-Zweig auf `main` und damit das `client-dist`-Artefakt blieben sonst stumm aus. `gate-parity.test.mjs` hält beides fest. Der lokale Pre-Push-Gate bleibt die erste Sperre.

## Zwei-Säulen-Gate

Die lokale Kette allein ist umgehbar: `core.hooksPath` steht nur in `.git/config`, `.husky/_` ist nicht im Repo, und `pnpm install --ignore-scripts` überspringt `prepare` → `husky`. Der wirksame Schutz ist zweiteilig.

`lib/commit-text.mjs` ist die einzige Quelle der Commit-Regeln — pure Funktion ohne I/O, aufrufbar aus Hook und Plugin. `commit-msg.mjs` ist nur noch Shim für lokale Hook-Belange (Argumentparsing, `git diff --cached --name-only`, Formatierung). `plugins/commit-integrity.mjs` nutzt dieselbe Funktion gegen die echten Commits der Range und läuft als erster Schritt im Workflow mit `fetch-depth: 0`, weil der Engine-Slicer in einem frischen CI-Checkout einen leeren Diff sieht und deshalb keine Range kennt. Der Workflow übergibt `github.event.before` explizit.

Ein Merge-Commit hat keinen eigenen Inhalt, deshalb liest `commit-integrity` die Range mit `git log --no-merges`. GitHub erzeugt für jeden Pull Request zusätzlich einen synthetischen Test-Merge unter `refs/pull/N/merge`, der nie einen Body besitzt; ohne diese Regel wäre jeder Pull Request dauerhaft rot, obwohl die Inhalts-Commits vollständig konform sind. Der Merge bleibt über seine Eltern im Geltungsbereich. `lib/integration-text.mjs` ist die zweite reine Quelle für Integrations-Nachrichten: `prepare-commit-msg.mjs` erzeugt daraus einen gate-konformen Body, wenn Git einen Merge oder Squash mit zu dünnem Text vorbereitet, und derselbe `checkMessage` prüft die Erzeugung nach.

Die zweite Säule ist `required_status_checks` auf `main` für den Kontext `Shinon Gate`. Erst dadurch wird ein Push mit `--no-verify` wirkungslos: Der lokale Bypass ändert den Exit-Code des Hooks, nicht den Status des Remote-Checks. Das Plugin ist fail-closed — unauflösbare Referenz, fehlender Wert nach `--from` oder unlesbare Range führen zu Exit 1 statt zu einem grünen Durchwinken.

## Versionierung

`VERSION` + alle `package.json` synchron, PATCH 0..99 → MINOR 0..99 → MAJOR carry. Die Basis kommt aus `origin/main` (`--next` fragt nur, `--ref` überschreibt sie), damit ein hinterherer Branch keine Nummer doppelt vergibt. Loop-Schutz `SHINON_SKIP_BUMP=1`.
