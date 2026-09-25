# scripts/shinon/docs/ARCHITEKTUR.md

## Rolle

Lokale Gate-Engine + Test-Suite. Globale Governance-Module laufen bei jedem Commit; deterministische Domain-Checks werden zusätzlich nach Commit-Slices ausgewählt. Full-Run ist NICHT der Standard — sicher + performant mit Base + Core.

## Slicer

- `git diff --cached --name-only` → changed Files
- `shouldRun(plugin, changed)` → skip/run
- Base (immer): `loc-gate`, `global-loc-gate`, `hygiene-gate`, `version-gate`, `commit-gate`, `schema-contract`, `modularity-gate`, `dead-code-gate`, `redundancy-gate`
- Core (nur bei relevantem Slice): `core-determinism` (sim-core/contracts, bannt Math.random + crypto.random + Date/sin/pow), `false-positive` (combat/genome/matchmaking/sync)
- `lib/engine-policy.mjs` entscheidet diese Trigger rein aus der geladenen Policy; `engine.mjs` orchestriert nur noch Dateisammlung, Plugin-Start und Verdict.
- Full nur in `pre-push` via `--full`

## Plugins

Je Plugin eine `.mjs` in `plugins/`, max 150 LOC, ein Job. Gemeinsame Source-Erkennung, Ignore-Regeln und LOC-Zählung liegen in `lib/source-scan.mjs`; versionierte Gate-, LOC-, Ignore-, Dependency- und Engine-Trigger-Policies liegen in `policy.json`, werden über `policy.mjs` geladen und vor jeder Verwendung strikt mit `policy-schema.mjs` validiert. Zusätzlich müssen alle konfigurierten Engine-Plugin-Namen zu tatsächlich vorhandenen Plugin-Dateien passen und jede vorhandene Plugin-Datei muss einen Always- oder Slice-Trigger besitzen. `engine.mjs` entscheidet Slices ausschließlich anhand dieser Policy. Nur die unterstützte Policy-Version ist zulässig; bei inkompatibler oder fehlerhafter Policy gibt es keinen stillen Fallback, sondern einen Hard-Fail. Globale Module `global-loc-gate`, `schema-contract`, `modularity-gate`, `dead-code-gate` und `redundancy-gate` sind Hard-Fails und laufen unabhängig vom Diff.

## Hooks & Kette

pre-commit → `engine.mjs` (slice: Base immer, Core nach Bedarf) → commit-msg → `commit-msg.mjs` (Prosa 200, Bullets, Footer, Datei-Nennung) → post-commit → Root-Commit-Erkennung bleibt `0.0.1`, danach `bump-version.mjs` (mechanisch 0.0.1→0.0.99→0.1.0) + `amend` mit aktiven Hooks + `version-gate` + Auto-Push → pre-push → `engine.mjs --full` (letzte Sicherung). GitHub Actions wiederholt den vollständigen Lauf als `Shinon Gate`; Branch-Protection verlangt diesen Status für `main`.

## Versionierung

`VERSION` + alle `package.json` synchron, PATCH 0..99 → MINOR 0..99 → MAJOR carry. Loop-Schutz `SHINON_SKIP_BUMP=1`.
