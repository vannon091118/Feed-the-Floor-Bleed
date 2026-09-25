# scripts/shinon/docs/ARCHITEKTUR.md

## Rolle

Lokale Gate-Engine + Test-Suite. Jeder Test ist ein modulares Plugin, Shinon separiert die Test-Notwendigkeit dynamisch nach Commit-Slices. Full-Run ist NICHT der Standard — sicher + performant mit Base + Core.

## Slicer

- `git diff --cached --name-only` → changed Files
- `shouldRun(plugin, changed)` → skip/run
- Base (immer): `loc-gate`, `hygiene-gate`, `version-gate`, `commit-gate`
- Core (nur bei relevantem Slice): `core-determinism` (sim-core/contracts, bannt Math.random + crypto.random + Date/sin/pow), `schema-contract` (contracts/sync/net), `false-positive` (combat/genome/matchmaking/sync)
- Full nur in `pre-push` via `--full`

## Plugins

Je Plugin eine `.mjs` in `plugins/`, max 150 LOC, ein Job.

## Hooks & Kette

pre-commit → `engine.mjs` (slice: Base immer, Core nach Bedarf) → commit-msg → `commit-msg.mjs` (Prosa 200, Bullets, Footer, Datei-Nennung) → post-commit → Root-Commit-Erkennung bleibt `0.0.1`, danach `bump-version.mjs` (mechanisch 0.0.1→0.0.99→0.1.0) + `amend` mit aktiven Hooks + `version-gate` + Auto-Push → pre-push → `engine.mjs --full` (letzte Sicherung). GitHub Actions wiederholt den vollständigen Lauf als `Shinon Gate`; Branch-Protection verlangt diesen Status für `main`.

## Versionierung

`VERSION` + alle `package.json` synchron, PATCH 0..99 → MINOR 0..99 → MAJOR carry. Loop-Schutz `SHINON_SKIP_BUMP=1`.
